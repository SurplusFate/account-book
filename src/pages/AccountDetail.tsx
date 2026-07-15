// 账号本子 - 账号详情页
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Pencil,
  Trash2,
  Pin,
  Star,
  User,
  KeyRound,
  Globe,
  StickyNote,
} from 'lucide-react';
import { useStore } from '@/store';
import AccountIcon from '@/components/AccountIcon';
import ConfirmModal from '@/components/ConfirmModal';
import { copyText, hostnameOf, formatTime } from '@/lib/utils';
import { toast } from '@/components/Toast';

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const account = useStore((s) => s.getAccount(id!));
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const togglePinned = useStore((s) => s.togglePinned);
  const deleteAccount = useStore((s) => s.deleteAccount);
  const settings = useStore((s) => s.vault?.settings);

  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!account || account.deletedAt) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-cream-dim">账号不存在或已删除</p>
        <button onClick={() => navigate('/')} className="btn-ghost mt-4">
          返回列表
        </button>
      </div>
    );
  }

  async function handleCopy(field: string, value: string) {
    if (!value) return;
    const ok = await copyText(value);
    if (ok) {
      setCopied(field);
      toast(`已复制${field}`, 'success');
      // 自动清除剪贴板
      const seconds = settings?.clipboardClearSeconds ?? 0;
      if (seconds > 0) {
        setTimeout(() => {
          navigator.clipboard.writeText('').catch(() => {});
          setCopied(null);
        }, seconds * 1000);
      } else {
        setTimeout(() => setCopied(null), 2000);
      }
    } else {
      toast('复制失败', 'error');
    }
  }

  async function handleDelete() {
    setConfirmDelete(false);
    await deleteAccount(account!.id);
    toast('已删除账号', 'success');
    navigate('/');
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      {/* 顶部导航 */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-cream/10 text-cream-dim transition-colors hover:border-amber-500/40 hover:text-cream"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => void togglePinned(account.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
              account.pinned
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                : 'border-cream/10 text-cream-dim hover:border-amber-500/40 hover:text-cream'
            }`}
            title={account.pinned ? '取消置顶' : '置顶'}
          >
            <Pin className={`h-4 w-4 ${account.pinned ? 'fill-amber-400' : ''}`} />
          </button>
          <button
            onClick={() => void toggleFavorite(account.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
              account.favorite
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                : 'border-cream/10 text-cream-dim hover:border-amber-500/40 hover:text-cream'
            }`}
            title={account.favorite ? '取消收藏' : '收藏'}
          >
            <Star className={`h-4 w-4 ${account.favorite ? 'fill-amber-400' : ''}`} />
          </button>
          <button
            onClick={() => navigate(`/account/${account.id}/edit`)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-cream/10 text-cream-dim transition-colors hover:border-amber-500/40 hover:text-cream"
            title="编辑"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-danger/30 text-danger transition-colors hover:bg-danger/15"
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 标题区 */}
      <div className="card mb-4 flex items-center gap-4 p-6">
        <AccountIcon url={account.url} title={account.title} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-xl font-semibold text-cream">
            {account.title || '未命名'}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="chip border border-cream/10 bg-white/[0.03] text-cream-dim">
              {account.category}
            </span>
            <span className="text-xs text-cream-dim">
              更新于 {formatTime(account.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 字段列表 */}
      <div className="card divide-y divide-cream/6 overflow-hidden">
        {/* 用户名 */}
        <FieldRow
          icon={User}
          label="用户名"
          value={account.username}
          copied={copied === '用户名'}
          onCopy={() => handleCopy('用户名', account.username)}
        />
        {/* 密码 */}
        <div className="flex items-center gap-4 px-5 py-4">
          <KeyRound className="h-4.5 w-4.5 shrink-0 text-cream-dim" />
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-cream-dim">密码</div>
            <div className="mt-0.5 truncate font-mono text-sm text-cream">
              {account.password
                ? showPwd
                  ? account.password
                  : '•'.repeat(Math.min(account.password.length, 16))
                : '—'}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => setShowPwd((v) => !v)}
              className="rounded-md p-2 text-cream-dim transition-colors hover:text-cream"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={() => handleCopy('密码', account.password)}
              className="rounded-md p-2 text-cream-dim transition-colors hover:text-amber-400"
            >
              {copied === '密码' ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        {/* 网址 */}
        <FieldRow
          icon={Globe}
          label="网址"
          value={account.url ? hostnameOf(account.url) : ''}
          copied={copied === '网址'}
          onCopy={() => handleCopy('网址', account.url)}
          action={
            account.url ? (
              <a
                href={account.url.startsWith('http') ? account.url : 'https://' + account.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-2 text-cream-dim transition-colors hover:text-amber-400"
                title="打开网址"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : undefined
          }
        />
        {/* 备注 */}
        {account.notes && (
          <div className="flex gap-4 px-5 py-4">
            <StickyNote className="h-4.5 w-4.5 shrink-0 text-cream-dim" />
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wider text-cream-dim">备注</div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-cream">
                {account.notes}
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-cream-dim/60">
        创建于 {formatTime(account.createdAt)}
      </p>

      <ConfirmModal
        open={confirmDelete}
        title="删除账号"
        danger
        description={`确定要删除「${account.title}」吗？此操作可通过云同步传播到其他设备，删除后不可直接恢复。`}
        confirmText="删除"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function FieldRow({
  icon: Icon,
  label,
  value,
  copied,
  onCopy,
  action,
}: {
  icon: typeof User;
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <Icon className="h-4.5 w-4.5 shrink-0 text-cream-dim" />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wider text-cream-dim">{label}</div>
        <div className="mt-0.5 truncate text-sm text-cream">{value || '—'}</div>
      </div>
      <div className="flex shrink-0 gap-1">
        {value && (
          <button
            onClick={onCopy}
            className="rounded-md p-2 text-cream-dim transition-colors hover:text-amber-400"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        )}
        {action}
      </div>
    </div>
  );
}
