// 账号本子 - 本地存储层（IndexedDB）
// 仅存储加密产物与非敏感元数据，明文保险库只存在于内存

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { EncryptedVault, WebDavConfig, SyncMeta } from '@/types';

interface AccountBookDB extends DBSchema {
  vault: {
    key: string;
    value: EncryptedVault;
  };
  meta: {
    key: string;
    value: WebDavConfig | SyncMeta | number | null;
  };
}

const DB_NAME = 'account-book';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AccountBookDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AccountBookDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AccountBookDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('vault')) {
          db.createObjectStore('vault');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      },
    });
  }
  return dbPromise;
}

// ---------- 保险库（加密） ----------
export async function loadEncryptedVault(): Promise<EncryptedVault | null> {
  const db = await getDB();
  const value = await db.get('vault', 'main');
  return value ?? null;
}

export async function saveEncryptedVault(vault: EncryptedVault): Promise<void> {
  const db = await getDB();
  await db.put('vault', vault, 'main');
}

export async function clearVault(): Promise<void> {
  const db = await getDB();
  await db.delete('vault', 'main');
}

/** 本地是否存在已初始化的保险库 */
export async function hasVault(): Promise<boolean> {
  const v = await loadEncryptedVault();
  return !!v;
}

// ---------- 元数据 ----------
export async function getMeta<T = unknown>(key: string): Promise<T | null> {
  const db = await getDB();
  const value = (await db.get('meta', key)) as T | undefined;
  return value ?? null;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('meta', value as AccountBookDB['meta']['value'], key);
}

// ---------- WebDAV 配置 ----------
export async function loadWebDavConfig(): Promise<WebDavConfig | null> {
  return getMeta<WebDavConfig>('webdav');
}

export async function saveWebDavConfig(config: WebDavConfig): Promise<void> {
  await setMeta('webdav', config);
}

export async function clearWebDavConfig(): Promise<void> {
  await setMeta('webdav', null);
}

// ---------- 同步元信息 ----------
export async function loadSyncMeta(): Promise<SyncMeta> {
  const meta = await getMeta<SyncMeta>('syncMeta');
  return (
    meta ?? {
      lastSyncAt: null,
      lastStatus: 'idle',
      lastError: null,
      remoteUpdatedAt: null,
    }
  );
}

export async function saveSyncMeta(meta: SyncMeta): Promise<void> {
  await setMeta('syncMeta', meta);
}

// ---------- 上次活动时间（用于自动锁定） ----------
export async function getLastActiveAt(): Promise<number> {
  return (await getMeta<number>('lastActiveAt')) ?? Date.now();
}

export async function touchLastActiveAt(): Promise<void> {
  await setMeta('lastActiveAt', Date.now());
}
