// 账号本子 - 账号编辑/新建页
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff, Wand2, Loader2 } from 'lucide-react';
import { useStore, createEmptyAccount } from '@/store';
import type { AccountItem } from '@/types';
import { DEFAULT_CATEGORIES } from '@/types';
import PasswordGenerator from '@/components/PasswordGenerator';
import StrengthMeter from '@/components/StrengthMeter';
import { toast } from '@/components/Toast';

export default function AccountEdit() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const vault = useStore((s) => s.vault);
  const upsertAccount = useStore((s) => s.upsertAccount);
  const removeCategory = useStore((s) => s.removeCategory);

  const existing = id ? vault?.accounts.find((a) => a.id === id) : undefined;

  const [form, setForm] = useState<AccountItem>(
    existing ? { ...existing } : createEmptyAccount(),
  );
  const [showPwd, setShowPwd] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [showCatInput, setShowCatInput] = useState(false);

  const categories = vault?.categories ?? DEFAULT_CATEGORIES;

  function update<K extends keyof AccountItem>(key: K, value: AccountItem[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('请填写标题', 'error');
      return;
    }
    setSaving(true);
    await upsertAccount(form);
    setSaving(false);
    toast(isEdit ? '已保存修改' : '已创建账号', 'success');
    navigate(`/account/${form.id}`);
  }

  async function handleAddCategory() {
    const name = newCat.trim();
    if (!name) return;
    // 通过 store.addCategory 持久化，并选中
    await useStore.getState().addCategory(name);
    update('category', name);
    setNewCat('');
    setShowCatInput(false);
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      {/* 顶部导航 */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-cream/10 text-cream-dim transition-colors hover:border-amber-500/40 hover:text-cream"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <h1 className="font-serif text-xl font-semibold text-cream">
          {isEdit ? '编辑账号' : '新建账号'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-5 p-6">
          {/* 标题 */}
          <div>
            <label className="label">标题 *</label>
            <input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="如：GitHub、微信、支付宝"
              className="input"
              autoFocus
            />
          </div>

          {/* 用户名 */}
          <div>
            <label className="label">用户名 / 邮箱 / 手机号</label>
            <input
              value={form.username}
              onChange={(e) => update('username', e.target.value)}
              placeholder="登录账号"
              className="input"
            />
          </div>

          {/* 密码 */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label mb-0">密码</label>
              <button
                type="button"
                onClick={() => setShowGen((v) => !v)}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  showGen ? 'text-amber-400' : 'text-cream-dim hover:text-amber-400'
                }`}
              >
                <Wand2 className="h-3.5 w-3.5" />
                生成器
              </button>
            </div>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="密码"
                className="input pr-20 font-mono"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="rounded-md p-1.5 text-cream-dim transition-colors hover:text-cream"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {form.password && (
              <div className="mt-2.5">
                <StrengthMeter password={form.password} />
              </div>
            )}
          </div>

          {/* 密码生成器（可折叠） */}
          {showGen && (
            <div className="animate-fade-in">
              <PasswordGenerator
                onUse={(pwd) => {
                  update('password', pwd);
                  setShowPwd(true);
                  toast('已填入生成的密码', 'success');
                }}
              />
            </div>
          )}

          {/* 网址 */}
          <div>
            <label className="label">网址</label>
            <input
              value={form.url}
              onChange={(e) => update('url', e.target.value)}
              placeholder="https://example.com"
              className="input"
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="label">分类</label>
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => update('category', cat)}
                  className={`chip ${
                    form.category === cat
                      ? 'bg-amber-500 text-ink-950'
                      : 'border border-cream/10 bg-white/[0.03] text-cream-muted hover:border-amber-500/30'
                  }`}
                >
                  {cat}
                </button>
              ))}
              {!showCatInput ? (
                <button
                  type="button"
                  onClick={() => setShowCatInput(true)}
                  className="chip border border-dashed border-cream/15 text-cream-dim hover:border-amber-500/40"
                >
                  + 新分类
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleAddCategory();
                      }
                      if (e.key === 'Escape') setShowCatInput(false);
                    }}
                    placeholder="分类名"
                    className="w-24 rounded-full border border-amber-500/30 bg-ink-800 px-3 py-1.5 text-xs text-cream outline-none"
                  />
                  <button type="button" onClick={handleAddCategory} className="text-xs text-amber-400">
                    确定
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="label">备注</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="绑定的邮箱、安全问题、恢复码等"
              rows={4}
              className="input resize-none"
            />
          </div>

          {/* 开关 */}
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center justify-between rounded-xl border border-cream/10 bg-white/[0.02] px-4 py-3">
              <span className="text-sm text-cream-muted">置顶</span>
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) => update('pinned', e.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
            </label>
            <label className="flex flex-1 cursor-pointer items-center justify-between rounded-xl border border-cream/10 bg-white/[0.02] px-4 py-3">
              <span className="text-sm text-cream-muted">收藏</span>
              <input
                type="checkbox"
                checked={form.favorite}
                onChange={(e) => update('favorite', e.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
            </label>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-ghost flex-1"
          >
            取消
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? '保存修改' : '创建'}
          </button>
        </div>
      </form>
    </div>
  );
}
