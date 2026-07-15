// 账号本子 - 同步合并逻辑
// 基于时间戳的账号级合并 + 软删除同步

import type {
  AccountItem,
  VaultData,
  EncryptedVault,
} from '@/types';
import { decryptJSON, encryptJSON } from '@/lib/crypto';
import { downloadVault, uploadVault } from '@/lib/webdav';
import type { WebDavConfig } from '@/types';

export interface SyncResult {
  ok: boolean;
  message: string;
  merged: VaultData | null;
  remoteUpdatedAt: number | null;
}

/** 合并两个保险库的账号列表 */
export function mergeAccounts(
  local: AccountItem[],
  remote: AccountItem[],
): AccountItem[] {
  const map = new Map<string, AccountItem>();
  // 先放入本地
  for (const a of local) map.set(a.id, a);
  // 用远程合并：取 updatedAt 较新者；尊重软删除
  for (const r of remote) {
    const l = map.get(r.id);
    if (!l) {
      // 本地无，直接采用远程（即使是已删除项，保留以便传播删除）
      map.set(r.id, r);
    } else {
      // 都存在：取较新的；若一方已软删除且时间较新，则保留删除
      const lDeleted = l.deletedAt != null;
      const rDeleted = r.deletedAt != null;
      if (lDeleted && rDeleted) {
        // 都已删除，取较新删除时间
        map.set(r.id, (r.deletedAt ?? 0) >= (l.deletedAt ?? 0) ? r : l);
      } else if (lDeleted) {
        map.set(r.id, (r.updatedAt ?? 0) >= (l.deletedAt ?? 0) ? r : l);
      } else if (rDeleted) {
        map.set(r.id, (r.deletedAt ?? 0) >= (l.updatedAt ?? 0) ? r : l);
      } else {
        map.set(r.id, r.updatedAt >= l.updatedAt ? r : l);
      }
    }
  }
  // 过滤掉过老的软删除项（30 天前删除）以控制体积
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const merged = Array.from(map.values()).filter((a) => {
    if (a.deletedAt == null) return true;
    return a.deletedAt > cutoff;
  });
  return merged;
}

/** 合并整个保险库 */
export function mergeVaults(local: VaultData, remote: VaultData): VaultData {
  const accounts = mergeAccounts(local.accounts, remote.accounts);
  // 分类合并去重
  const categories = Array.from(
    new Set([...local.categories, ...remote.categories]),
  );
  // 设置取较新者
  const settings =
    remote.updatedAt > local.updatedAt ? remote.settings : local.settings;
  return {
    version: Math.max(local.version, remote.version),
    accounts,
    categories,
    settings,
    updatedAt: Date.now(),
  };
}

/** 用当前密钥解密远程加密保险库 */
export async function decryptRemoteVault(
  remoteEncrypted: EncryptedVault,
  key: CryptoKey,
): Promise<VaultData | null> {
  try {
    return await decryptJSON<VaultData>(
      key,
      remoteEncrypted.ciphertext,
      remoteEncrypted.iv,
    );
  } catch {
    return null;
  }
}

/** 执行完整同步流程 */
export async function performSync(
  config: WebDavConfig,
  localVault: VaultData,
  localEncrypted: EncryptedVault,
  key: CryptoKey,
): Promise<SyncResult> {
  // 1. 下载远程
  const dl = await downloadVault(config);
  if (!dl.ok) {
    return { ok: false, message: dl.message, merged: null, remoteUpdatedAt: null };
  }

  let remoteEncrypted: EncryptedVault | null = null;
  if (dl.data) {
    try {
      remoteEncrypted = JSON.parse(dl.data) as EncryptedVault;
    } catch {
      return {
        ok: false,
        message: '云端数据格式错误',
        merged: null,
        remoteUpdatedAt: null,
      };
    }
  }

  // 2. 远程无数据 → 直接上传本地
  if (!remoteEncrypted) {
    const upRes = await uploadVault(config, JSON.stringify(localEncrypted));
    return {
      ok: upRes.ok,
      message: upRes.ok ? '已上传本地数据到云端' : upRes.message,
      merged: localVault,
      remoteUpdatedAt: localVault.updatedAt,
    };
  }

  // 3. 远程有数据 → 解密并合并
  const remoteVault = await decryptRemoteVault(remoteEncrypted, key);
  if (!remoteVault) {
    return {
      ok: false,
      message: '无法解密云端数据（主密码可能不一致）',
      merged: null,
      remoteUpdatedAt: null,
    };
  }

  const merged = mergeVaults(localVault, remoteVault);

  // 4. 重新加密合并后的保险库
  const { ciphertext, iv } = await encryptJSON(key, merged);
  const newEncrypted: EncryptedVault = {
    ...localEncrypted,
    ciphertext,
    iv,
  };

  // 5. 上传
  const upRes = await uploadVault(config, JSON.stringify(newEncrypted));
  return {
    ok: upRes.ok,
    message: upRes.ok ? '同步成功' : upRes.message,
    merged,
    remoteUpdatedAt: merged.updatedAt,
  };
}
