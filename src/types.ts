// 账号本子 - 核心类型定义

/** 单条账号记录 */
export interface AccountItem {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
  favorite: boolean;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
}

/** 应用设置（不含主密码哈希） */
export interface AppSettings {
  autoLockMinutes: number;
  clipboardClearSeconds: number;
  autoSync: boolean;
  syncIntervalMinutes: number;
}

/** 保险库明文结构（加密前） */
export interface VaultData {
  version: number;
  accounts: AccountItem[];
  categories: string[];
  settings: AppSettings;
  updatedAt: number;
}

/** 加密后的保险库（本地存储 & 云同步的载体） */
export interface EncryptedVault {
  ciphertext: string; // Base64 密文
  iv: string; // 初始化向量 Base64
  salt: string; // PBKDF2 盐值 Base64
  verifier: string; // 主密码验证块 Base64
  verifierIv: string; // 验证块 IV Base64
  iterations: number; // PBKDF2 迭代次数
}

/** WebDAV（坚果云）配置 */
export interface WebDavConfig {
  server: string; // 服务器地址，如 https://dav.jianguoyun.com/dav/
  username: string; // 坚果云账号
  password: string; // 应用专用密码
  directory: string; // 同步目录，如 account-book
}

/** 同步状态 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/** 同步元信息（非敏感，存于 meta 仓库） */
export interface SyncMeta {
  lastSyncAt: number | null;
  lastStatus: SyncStatus;
  lastError: string | null;
  remoteUpdatedAt: number | null;
}

export const DEFAULT_CATEGORIES: string[] = [];

export const UNCAT = '未分类';

export const DEFAULT_SETTINGS: AppSettings = {
  autoLockMinutes: 5,
  clipboardClearSeconds: 20,
  autoSync: false,
  syncIntervalMinutes: 30,
};

export function createEmptyVault(): VaultData {
  return {
    version: 1,
    accounts: [],
    categories: [],
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: Date.now(),
  };
}

export function createEmptyAccount(): AccountItem {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: '',
    favorite: false,
    pinned: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}
