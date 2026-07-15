// 账号本子 - 同步设置页（WebDAV / 坚果云）
import { useState, useEffect, type FormEvent } from 'react';
import {
  CloudCog,
  CloudUpload,
  CloudDownload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '@/store';
import type { WebDavConfig } from '@/types';
import { testConnection } from '@/lib/webdav';
import { timeAgo } from '@/lib/utils';
import { toast } from '@/components/Toast';

const JIANGUO_DEFAULT = 'https://dav.jianguoyun.com/dav/';

export default function SyncSettings() {
  const webdavConfig = useStore((s) => s.webdavConfig);
  const syncMeta = useStore((s) => s.syncMeta);
  const syncStatus = useStore((s) => s.syncStatus);
  const saveWebDav = useStore((s) => s.saveWebDav);
  const sync = useStore((s) => s.sync);
  const updateSettings = useStore((s) => s.updateSettings);
  const vault = useStore((s) => s.vault);
  const loadWebDav = useStore((s) => s.loadWebDav);

  const [form, setForm] = useState<WebDavConfig>(
    webdavConfig ?? {
      server: JIANGUO_DEFAULT,
      username: '',
      password: '',
      directory: 'account-book',
    },
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    void loadWebDav();
  }, [loadWebDav]);

  useEffect(() => {
    if (webdavConfig) setForm(webdavConfig);
  }, [webdavConfig]);

  function update<K extends keyof WebDavConfig>(key: K, value: WebDavConfig[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setTestResult(null);
  }

  async function handleTest() {
    if (!form.server || !form.username || !form.password) {
      toast('请填写完整的 WebDAV 配置', 'error');
      return;
    }
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(form);
    setTestResult(result);
    setTesting(false);
    if (result.ok) {
      await saveWebDav(form);
      toast(result.message, 'success');
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.server || !form.username || !form.password) {
      toast('请填写完整的 WebDAV 配置', 'error');
      return;
    }
    await saveWebDav(form);
    toast('已保存同步配置', 'success');
  }

  async function handleSync() {
    setSyncing(true);
    const result = await sync();
    setSyncing(false);
    toast(result.message, result.ok ? 'success' : 'error');
  }

  const isConfigured = !!(webdavConfig?.username && webdavConfig?.password);
  const statusConfig = {
    idle: { color: 'text-cream-dim', icon: CloudCog, label: '未同步' },
    syncing: { color: 'text-amber-400', icon: Loader2, label: '同步中', spin: true },
    success: { color: 'text-success', icon: CheckCircle2, label: '已同步' },
    error: { color: 'text-danger', icon: AlertCircle, label: '同步失败' },
  }[syncStatus];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-cream">云同步</h1>
        <p className="mt-1 text-sm text-cream-dim">
          通过 WebDAV 连接坚果云，加密同步账号数据
        </p>
      </div>

      {/* 同步状态卡片 */}
      {isConfigured && (
        <div className="card mb-5 flex items-center gap-4 p-5">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.03] ${statusConfig.color}`}>
            <StatusIcon className={`h-5 w-5 ${statusConfig.spin ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-cream">{statusConfig.label}</span>
              {syncMeta.lastSyncAt && (
                <span className="text-xs text-cream-dim">
                  · {timeAgo(syncMeta.lastSyncAt)}
                </span>
              )}
            </div>
            {syncMeta.lastError && (
              <p className="mt-0.5 truncate text-xs text-danger">{syncMeta.lastError}</p>
            )}
          </div>
          <button
            onClick={handleSync}
            disabled={syncing || syncStatus === 'syncing'}
            className="btn-primary"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            立即同步
          </button>
        </div>
      )}

      {/* WebDAV 配置表单 */}
      <form onSubmit={handleSave} className="card space-y-5 p-6">
        <div className="flex items-center gap-2">
          <CloudCog className="h-5 w-5 text-amber-400" />
          <h2 className="font-serif text-lg font-semibold text-cream">坚果云 WebDAV 配置</h2>
        </div>

        {/* 坚果云配置说明 */}
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3.5 text-xs text-cream-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="space-y-1.5">
            <p>
              在坚果云「账户信息 → 安全选项 → 第三方应用管理」中
              <strong className="text-amber-100">添加一个应用</strong>，
              获取<strong className="text-amber-100">应用专用密码</strong>用于下方填写。
            </p>
            <p className="text-cream-dim">
              服务器地址通常为 {JIANGUO_DEFAULT}（已预填，一般无需修改）
            </p>
          </div>
        </div>

        <div>
          <label className="label">服务器地址</label>
          <input
            value={form.server}
            onChange={(e) => update('server', e.target.value)}
            placeholder={JIANGUO_DEFAULT}
            className="input"
          />
        </div>

        <div>
          <label className="label">坚果云账号</label>
          <input
            value={form.username}
            onChange={(e) => update('username', e.target.value)}
            placeholder="你的坚果云登录邮箱或手机号"
            className="input"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="label">应用专用密码</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="坚果云第三方应用专用密码"
            className="input"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="label">同步目录</label>
          <input
            value={form.directory}
            onChange={(e) => update('directory', e.target.value)}
            placeholder="account-book"
            className="input"
          />
          <p className="mt-1.5 text-xs text-cream-dim">
            坚果云中用于存放加密数据的目录名
          </p>
        </div>

        {testResult && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm animate-fade-in ${
              testResult.ok
                ? 'border-success/30 bg-success/10 text-success'
                : 'border-danger/30 bg-danger/10 text-danger'
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {testResult.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="btn-ghost flex-1"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
            测试连接
          </button>
          <button type="submit" className="btn-primary flex-1">
            <CloudUpload className="h-4 w-4" />
            保存配置
          </button>
        </div>
      </form>

      {/* 自动同步开关 */}
      {isConfigured && (
        <div className="card mt-5 p-6">
          <h3 className="mb-4 font-serif text-base font-semibold text-cream">自动同步</h3>
          <label className="flex cursor-pointer items-center justify-between">
            <div>
              <div className="text-sm text-cream">开启自动同步</div>
              <div className="mt-0.5 text-xs text-cream-dim">
                每次修改账号后自动同步到坚果云
              </div>
            </div>
            <input
              type="checkbox"
              checked={vault?.settings.autoSync ?? false}
              onChange={(e) => void updateSettings({ autoSync: e.target.checked })}
              className="h-5 w-5 accent-amber-500"
            />
          </label>
        </div>
      )}
    </div>
  );
}
