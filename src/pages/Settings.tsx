// 账号本子 - 设置页
import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  KeyRound,
  ShieldCheck,
  Download,
  Upload,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Timer,
  Clipboard,
} from 'lucide-react';
import { useStore } from '@/store';
import StrengthMeter from '@/components/StrengthMeter';
import ConfirmModal from '@/components/ConfirmModal';
import { passwordStrength } from '@/lib/utils';
import { toast } from '@/components/Toast';

const AUTO_LOCK_OPTIONS = [
  { value: 1, label: '1 分钟' },
  { value: 5, label: '5 分钟' },
  { value: 15, label: '15 分钟' },
  { value: 30, label: '30 分钟' },
  { value: 0, label: '从不' },
];

const CLIPBOARD_OPTIONS = [
  { value: 0, label: '不自动清除' },
  { value: 10, label: '10 秒' },
  { value: 20, label: '20 秒' },
  { value: 30, label: '30 秒' },
  { value: 60, label: '60 秒' },
];

export default function Settings() {
  const vault = useStore((s) => s.vault);
  const updateSettings = useStore((s) => s.updateSettings);
  const changeMasterPassword = useStore((s) => s.changeMasterPassword);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const wipeAll = useStore((s) => s.wipeAll);
  const lock = useStore((s) => s.lock);
  const navigate = useNavigate();

  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);

  const [confirmWipe, setConfirmWipe] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const settings = vault?.settings;

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setChangeError(null);
    if (newPwd.length < 6) {
      setChangeError('新主密码至少需要 6 位');
      return;
    }
    if (newPwd !== confirmPwd) {
      setChangeError('两次输入的新主密码不一致');
      return;
    }
    if (passwordStrength(newPwd).score < 2) {
      setChangeError('新主密码强度过低');
      return;
    }
    setChanging(true);
    const ok = await changeMasterPassword(oldPwd, newPwd);
    setChanging(false);
    if (ok) {
      toast('主密码已修改', 'success');
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } else {
      setChangeError(useStore.getState().error ?? '修改失败');
    }
  }

  function handleExport() {
    const data = exportData();
    if (!data) {
      toast('暂无可导出数据', 'error');
      return;
    }
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `account-book-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('已导出加密备份', 'success');
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ok = await importData(text);
    if (ok) {
      toast('导入成功，请用主密码解锁', 'success');
      lock();
      navigate('/unlock');
    } else {
      toast('导入失败：文件格式不正确', 'error');
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleWipe() {
    setConfirmWipe(false);
    await wipeAll();
    toast('已清空所有数据', 'success');
    navigate('/unlock');
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-cream">设置</h1>
        <p className="mt-1 text-sm text-cream-dim">安全选项、数据管理与主密码</p>
      </div>

      {/* 安全设置 */}
      <section className="card mb-5 p-6">
        <div className="mb-5 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-amber-400" />
          <h2 className="font-serif text-lg font-semibold text-cream">安全</h2>
        </div>

        {/* 自动锁定 */}
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <Timer className="h-4 w-4 text-cream-dim" />
            <span className="text-sm text-cream-muted">自动锁定</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {AUTO_LOCK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => void updateSettings({ autoLockMinutes: opt.value })}
                className={`chip ${
                  settings?.autoLockMinutes === opt.value
                    ? 'bg-amber-500 text-ink-950'
                    : 'border border-cream/10 bg-white/[0.03] text-cream-muted hover:border-amber-500/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 剪贴板清除 */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Clipboard className="h-4 w-4 text-cream-dim" />
            <span className="text-sm text-cream-muted">复制后自动清除剪贴板</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CLIPBOARD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => void updateSettings({ clipboardClearSeconds: opt.value })}
                className={`chip ${
                  settings?.clipboardClearSeconds === opt.value
                    ? 'bg-amber-500 text-ink-950'
                    : 'border border-cream/10 bg-white/[0.03] text-cream-muted hover:border-amber-500/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 修改主密码 */}
      <section className="card mb-5 p-6">
        <div className="mb-5 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-400" />
          <h2 className="font-serif text-lg font-semibold text-cream">修改主密码</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">当前主密码</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={oldPwd}
                onChange={(e) => setOldPwd(e.target.value)}
                className="input pr-11"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-dim hover:text-cream"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">新主密码</label>
            <input
              type={showPwd ? 'text' : 'password'}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="input"
              autoComplete="off"
            />
            {newPwd && (
              <div className="mt-2.5">
                <StrengthMeter password={newPwd} />
              </div>
            )}
          </div>
          <div>
            <label className="label">确认新主密码</label>
            <input
              type={showPwd ? 'text' : 'password'}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className="input"
              autoComplete="off"
            />
          </div>
          {changeError && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
              {changeError}
            </div>
          )}
          <button type="submit" disabled={changing} className="btn-primary">
            {changing ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            修改主密码
          </button>
        </form>
      </section>

      {/* 数据管理 */}
      <section className="card mb-5 p-6">
        <div className="mb-5 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-amber-400" />
          <h2 className="font-serif text-lg font-semibold text-cream">数据管理</h2>
        </div>
        <div className="space-y-3">
          <button onClick={handleExport} className="flex w-full items-center gap-3 rounded-xl border border-cream/10 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-amber-500/30">
            <Download className="h-4.5 w-4.5 text-amber-400" />
            <div className="flex-1">
              <div className="text-sm text-cream">导出加密备份</div>
              <div className="mt-0.5 text-xs text-cream-dim">
                导出加密的 JSON 文件，可用于迁移到其他设备
              </div>
            </div>
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-xl border border-cream/10 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-amber-500/30"
          >
            <Upload className="h-4.5 w-4.5 text-amber-400" />
            <div className="flex-1">
              <div className="text-sm text-cream">导入备份</div>
              <div className="mt-0.5 text-xs text-cream-dim">
                从加密的 JSON 文件恢复（导入后需重新解锁）
              </div>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
      </section>

      {/* 危险操作 */}
      <section className="rounded-2xl border border-danger/20 bg-danger/[0.04] p-6">
        <div className="mb-4 flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-danger" />
          <h2 className="font-serif text-lg font-semibold text-danger">危险操作</h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-cream-muted">
            清空本地所有账号数据与同步配置（不影响坚果云云端已同步的数据）
          </div>
          <button onClick={() => setConfirmWipe(true)} className="btn-danger shrink-0">
            <Trash2 className="h-4 w-4" />
            清空数据
          </button>
        </div>
      </section>

      <ConfirmModal
        open={confirmWipe}
        title="清空所有数据"
        danger
        description="此操作将永久删除本设备上的所有账号数据与配置，且无法撤销。确定继续吗？"
        confirmText="确认清空"
        onConfirm={handleWipe}
        onCancel={() => setConfirmWipe(false)}
      />
    </div>
  );
}
