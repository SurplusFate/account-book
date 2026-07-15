// 账号本子 - 全局状态管理（zustand）
// 内存中持有解密后的保险库与主密钥；所有变更先改内存再加密落盘

import { create } from 'zustand';
import type {
  AccountItem,
  AppSettings,
  EncryptedVault,
  SyncMeta,
  VaultData,
  WebDavConfig,
} from '@/types';
import { createEmptyVault, createEmptyAccount, DEFAULT_SETTINGS } from '@/types';
import {
  decryptJSON,
  encryptJSON,
  initEncryptedVault,
  unlockWithPassword,
} from '@/lib/crypto';
import {
  clearVault,
  hasVault,
  loadEncryptedVault,
  loadSyncMeta,
  loadWebDavConfig,
  saveEncryptedVault,
  saveSyncMeta,
  saveWebDavConfig,
  clearWebDavConfig,
  touchLastActiveAt,
} from '@/lib/db';
import { performSync } from '@/lib/sync';
import type { SyncStatus } from '@/types';

interface AppState {
  // ---------- 会话状态 ----------
  initialized: boolean | null; // 本地是否已有保险库
  unlocked: boolean;
  key: CryptoKey | null;
  vault: VaultData | null;
  encrypted: EncryptedVault | null;
  loading: boolean;
  error: string | null;

  // ---------- 同步 ----------
  webdavConfig: WebDavConfig | null;
  syncMeta: SyncMeta;
  syncStatus: SyncStatus;

  // ---------- 初始化 ----------
  init: () => Promise<void>;

  // ---------- 主密码 ----------
  createVault: (password: string) => Promise<boolean>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  changeMasterPassword: (oldPwd: string, newPwd: string) => Promise<boolean>;

  // ---------- 账号 CRUD ----------
  upsertAccount: (account: AccountItem) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  togglePinned: (id: string) => Promise<void>;
  getAccount: (id: string) => AccountItem | undefined;

  // ---------- 分类 ----------
  addCategory: (name: string) => Promise<void>;
  removeCategory: (name: string) => Promise<void>;

  // ---------- 设置 ----------
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;

  // ---------- 同步 ----------
  loadWebDav: () => Promise<void>;
  saveWebDav: (config: WebDavConfig) => Promise<boolean>;
  sync: () => Promise<{ ok: boolean; message: string }>;

  // ---------- 数据 ----------
  exportData: () => string | null;
  importData: (json: string) => Promise<boolean>;
  wipeAll: () => Promise<void>;

  // ---------- 内部 ----------
  persist: () => Promise<void>;
  setError: (msg: string | null) => void;
  touch: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  initialized: null,
  unlocked: false,
  key: null,
  vault: null,
  encrypted: null,
  loading: false,
  error: null,
  webdavConfig: null,
  syncMeta: { lastSyncAt: null, lastStatus: 'idle', lastError: null, remoteUpdatedAt: null },
  syncStatus: 'idle',

  init: async () => {
    set({ loading: true, error: null });
    try {
      const exists = await hasVault();
      const webdav = await loadWebDavConfig();
      const syncMeta = await loadSyncMeta();
      set({
        initialized: exists,
        webdavConfig: webdav,
        syncMeta,
        loading: false,
      });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  createVault: async (password) => {
    set({ loading: true, error: null });
    try {
      const { encrypted, key } = await initEncryptedVault(password);
      const vault = createEmptyVault();
      const { ciphertext, iv } = await encryptJSON(key, vault);
      const full: EncryptedVault = { ...encrypted, ciphertext, iv };
      await saveEncryptedVault(full);
      set({
        initialized: true,
        unlocked: true,
        key,
        vault,
        encrypted: full,
        loading: false,
      });
      return true;
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
      return false;
    }
  },

  unlock: async (password) => {
    set({ loading: true, error: null });
    try {
      const enc = await loadEncryptedVault();
      if (!enc) {
        set({ loading: false, error: '未找到本地保险库' });
        return false;
      }
      const key = await unlockWithPassword(
        password,
        enc.salt,
        enc.iterations,
        enc.verifier,
        enc.verifierIv,
      );
      if (!key) {
        set({ loading: false, error: '主密码错误' });
        return false;
      }
      const vault = await decryptJSON<VaultData>(key, enc.ciphertext, enc.iv);
      set({
        unlocked: true,
        key,
        vault,
        encrypted: enc,
        loading: false,
        error: null,
      });
      return true;
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
      return false;
    }
  },

  lock: () => {
    set({
      unlocked: false,
      key: null,
      vault: null,
      encrypted: null,
      error: null,
    });
  },

  changeMasterPassword: async (oldPwd, newPwd) => {
    const { key, vault } = get();
    if (!key || !vault) return false;
    // 校验旧密码
    const enc = await loadEncryptedVault();
    if (!enc) return false;
    const checkKey = await unlockWithPassword(
      oldPwd,
      enc.salt,
      enc.iterations,
      enc.verifier,
      enc.verifierIv,
    );
    if (!checkKey) {
      set({ error: '原主密码错误' });
      return false;
    }
    // 用新密码重新派生密钥并加密
    const { encrypted: newEnc, key: newKey } = await initEncryptedVault(newPwd);
    const { ciphertext, iv } = await encryptJSON(newKey, vault);
    const full: EncryptedVault = { ...newEnc, ciphertext, iv };
    await saveEncryptedVault(full);
    set({ key: newKey, encrypted: full, error: null });
    return true;
  },

  upsertAccount: async (account) => {
    const { vault } = get();
    if (!vault) return;
    const idx = vault.accounts.findIndex((a) => a.id === account.id);
    const updated = { ...account, updatedAt: Date.now() };
    const accounts = [...vault.accounts];
    if (idx >= 0) {
      accounts[idx] = { ...accounts[idx], ...updated };
    } else {
      accounts.push(updated);
    }
    const newVault = { ...vault, accounts, updatedAt: Date.now() };
    set({ vault: newVault });
    await get().persist();
  },

  deleteAccount: async (id) => {
    const { vault } = get();
    if (!vault) return;
    // 软删除以便同步传播
    const accounts = vault.accounts.map((a) =>
      a.id === id ? { ...a, deletedAt: Date.now(), updatedAt: Date.now() } : a,
    );
    const newVault = { ...vault, accounts, updatedAt: Date.now() };
    set({ vault: newVault });
    await get().persist();
  },

  toggleFavorite: async (id) => {
    const { vault } = get();
    if (!vault) return;
    const accounts = vault.accounts.map((a) =>
      a.id === id
        ? { ...a, favorite: !a.favorite, updatedAt: Date.now() }
        : a,
    );
    set({ vault: { ...vault, accounts, updatedAt: Date.now() } });
    await get().persist();
  },

  togglePinned: async (id) => {
    const { vault } = get();
    if (!vault) return;
    const accounts = vault.accounts.map((a) =>
      a.id === id ? { ...a, pinned: !a.pinned, updatedAt: Date.now() } : a,
    );
    set({ vault: { ...vault, accounts, updatedAt: Date.now() } });
    await get().persist();
  },

  getAccount: (id) => {
    return get().vault?.accounts.find((a) => a.id === id);
  },

  addCategory: async (name) => {
    const { vault } = get();
    if (!vault) return;
    const trimmed = name.trim();
    if (!trimmed || vault.categories.includes(trimmed)) return;
    set({
      vault: { ...vault, categories: [...vault.categories, trimmed] },
    });
    await get().persist();
  },

  removeCategory: async (name) => {
    const { vault } = get();
    if (!vault) return;
    const accounts = vault.accounts.map((a) =>
      a.category === name ? { ...a, category: '', updatedAt: Date.now() } : a,
    );
    set({
      vault: {
        ...vault,
        categories: vault.categories.filter((c) => c !== name),
        accounts,
        updatedAt: Date.now(),
      },
    });
    await get().persist();
  },

  updateSettings: async (patch) => {
    const { vault } = get();
    if (!vault) return;
    set({
      vault: {
        ...vault,
        settings: { ...vault.settings, ...patch },
        updatedAt: Date.now(),
      },
    });
    await get().persist();
  },

  loadWebDav: async () => {
    const config = await loadWebDavConfig();
    set({ webdavConfig: config });
  },

  saveWebDav: async (config) => {
    await saveWebDavConfig(config);
    set({ webdavConfig: config });
    return true;
  },

  sync: async () => {
    const { webdavConfig, vault, encrypted, key } = get();
    if (!webdavConfig || !vault || !encrypted || !key) {
      return { ok: false, message: '缺少配置或未解锁' };
    }
    set({ syncStatus: 'syncing' });
    try {
      const result = await performSync(webdavConfig, vault, encrypted, key);
      const status: SyncStatus = result.ok ? 'success' : 'error';
      const newMeta: SyncMeta = {
        lastSyncAt: Date.now(),
        lastStatus: status,
        lastError: result.ok ? null : result.message,
        remoteUpdatedAt: result.remoteUpdatedAt,
      };
      await saveSyncMeta(newMeta);
      set({ syncMeta: newMeta, syncStatus: status });
      if (result.ok && result.merged) {
        // 更新本地内存与密文
        const { ciphertext, iv } = await encryptJSON(key, result.merged);
        const newEnc: EncryptedVault = { ...encrypted, ciphertext, iv };
        await saveEncryptedVault(newEnc);
        set({ vault: result.merged, encrypted: newEnc });
      }
      return { ok: result.ok, message: result.message };
    } catch (e) {
      const msg = (e as Error).message;
      const newMeta: SyncMeta = {
        lastSyncAt: Date.now(),
        lastStatus: 'error',
        lastError: msg,
        remoteUpdatedAt: null,
      };
      await saveSyncMeta(newMeta);
      set({ syncMeta: newMeta, syncStatus: 'error' });
      return { ok: false, message: msg };
    }
  },

  exportData: () => {
    const { vault, encrypted } = get();
    if (!vault || !encrypted) return null;
    // 导出完整加密产物，可在其他设备导入后用主密码解锁
    return JSON.stringify(
      { type: 'account-book-backup', version: 1, encrypted, exportedAt: Date.now() },
      null,
      2,
    );
  },

  importData: async (json) => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.encrypted || parsed.type !== 'account-book-backup') {
        return false;
      }
      await saveEncryptedVault(parsed.encrypted as EncryptedVault);
      set({
        initialized: true,
        unlocked: false,
        key: null,
        vault: null,
        encrypted: null,
        error: null,
      });
      return true;
    } catch {
      return false;
    }
  },

  wipeAll: async () => {
    await clearVault();
    await clearWebDavConfig();
    await saveSyncMeta({
      lastSyncAt: null,
      lastStatus: 'idle',
      lastError: null,
      remoteUpdatedAt: null,
    });
    set({
      initialized: false,
      unlocked: false,
      key: null,
      vault: null,
      encrypted: null,
      webdavConfig: null,
      syncMeta: {
        lastSyncAt: null,
        lastStatus: 'idle',
        lastError: null,
        remoteUpdatedAt: null,
      },
      error: null,
    });
  },

  persist: async () => {
    const { vault, key, encrypted } = get();
    if (!vault || !key || !encrypted) return;
    const { ciphertext, iv } = await encryptJSON(key, vault);
    const newEnc: EncryptedVault = { ...encrypted, ciphertext, iv };
    await saveEncryptedVault(newEnc);
    set({ encrypted: newEnc });
    // 若开启自动同步则触发
    if (vault.settings.autoSync && get().webdavConfig) {
      void get().sync();
    }
  },

  setError: (msg) => set({ error: msg }),

  touch: () => {
    void touchLastActiveAt();
  },
}));

// 重新导出工厂函数便于页面使用
export { createEmptyAccount };
export { DEFAULT_SETTINGS };
