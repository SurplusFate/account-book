// 账号本子 - 账号列表页
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, KeyRound, FolderPlus, X, Trash2 } from 'lucide-react';
import { useStore } from '@/store';
import AccountCard from '@/components/AccountCard';
import { matchesSearch } from '@/lib/utils';
import { DEFAULT_CATEGORIES } from '@/types';
import { toast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

export default function Accounts() {
  const vault = useStore((s) => s.vault);
  const addCategory = useStore((s) => s.addCategory);
  const removeCategory = useStore((s) => s.removeCategory);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('全部');
  const [newCat, setNewCat] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  const accounts = vault?.accounts ?? [];
  const categories = vault?.categories ?? DEFAULT_CATEGORIES;

  // 过滤掉已删除项
  const visible = useMemo(() => {
    let list = accounts.filter((a) => !a.deletedAt);
    if (activeCat === '收藏') {
      list = list.filter((a) => a.favorite);
    } else if (activeCat !== '全部') {
      list = list.filter((a) => a.category === activeCat);
    }
    if (query.trim()) {
      const q = query.trim();
      list = list.filter((a) =>
        [a.title, a.username, a.url, a.notes, a.category]
          .some((f) => matchesSearch(f, q)),
      );
    }
    // 排序：置顶 → 收藏 → 更新时间
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [accounts, activeCat, query]);

  const tabs = ['全部', ...categories, '收藏'];

  async function handleAddCategory() {
    const name = newCat.trim();
    if (!name) return;
    if ((categories as string[]).includes(name)) {
      toast('该分类已存在', 'error');
      return;
    }
    await addCategory(name);
    setActiveCat(name);
    setNewCat('');
    setShowAddCat(false);
    toast('已添加分类', 'success');
  }

  async function handleRemoveCategory() {
    if (!catToDelete) return;
    const name = catToDelete;
    await removeCategory(name);
    if (activeCat === name) setActiveCat('全部');
    setCatToDelete(null);
    toast('分类已删除，账号移至「其他」', 'success');
  }

  const isDefaultCat = (cat: string) =>
    ['全部', '收藏', ...DEFAULT_CATEGORIES].includes(cat);

  return (
    <div className="animate-fade-in">
      {/* 页头 */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-cream">我的账号</h1>
          <p className="mt-1 text-sm text-cream-dim">
            共 {accounts.filter((a) => !a.deletedAt).length} 条记录
          </p>
        </div>
        <button
          onClick={() => navigate('/account/new')}
          className="btn-primary hidden md:inline-flex"
        >
          <Plus className="h-4 w-4" />
          新建
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-cream-dim" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索标题、用户名、网址…"
          className="input pl-11"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream-dim hover:text-cream"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 分类标签 */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {tabs.map((cat) => (
          <div key={cat} className="group relative">
            <button
              onClick={() => setActiveCat(cat)}
              className={`chip ${
                activeCat === cat
                  ? 'bg-amber-500 text-ink-950 shadow-glow'
                  : 'border border-cream/10 bg-white/[0.03] text-cream-muted hover:border-amber-500/30 hover:text-cream'
              } ${!isDefaultCat(cat) ? 'pr-7' : ''}`}
            >
              {cat}
            </button>
            {!isDefaultCat(cat) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCatToDelete(cat);
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-cream-dim opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                title="删除分类"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {!showAddCat ? (
          <button
            onClick={() => setShowAddCat(true)}
            className="chip border border-dashed border-cream/15 text-cream-dim hover:border-amber-500/40 hover:text-amber-400"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            新建分类
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleAddCategory();
                if (e.key === 'Escape') setShowAddCat(false);
              }}
              placeholder="分类名"
              className="w-24 rounded-full border border-amber-500/30 bg-ink-800 px-3 py-1.5 text-xs text-cream outline-none focus:border-amber-500"
            />
            <button onClick={handleAddCategory} className="text-xs text-amber-400 hover:text-amber-300">
              确定
            </button>
            <button onClick={() => setShowAddCat(false)} className="text-xs text-cream-dim hover:text-cream">
              取消
            </button>
          </div>
        )}
      </div>

      {/* 列表 / 空状态 */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream/10 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400/70">
            <KeyRound className="h-8 w-8" />
          </div>
          <h3 className="font-serif text-lg text-cream">
            {query ? '未找到匹配的账号' : '还没有账号记录'}
          </h3>
          <p className="mt-1.5 text-sm text-cream-dim">
            {query ? '换个关键词试试' : '点击下方按钮，添加你的第一个账号'}
          </p>
          {!query && (
            <button
              onClick={() => navigate('/account/new')}
              className="btn-primary mt-6"
            >
              <Plus className="h-4 w-4" />
              添加账号
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((a) => (
            <AccountCard key={a.id} account={a} />
          ))}
        </div>
      )}

      <ConfirmModal
        open={catToDelete !== null}
        title="删除分类"
        danger
        description={`确定要删除分类「${catToDelete ?? ''}」吗？该分类下的账号将被移至「其他」分类。`}
        confirmText="确认删除"
        onConfirm={handleRemoveCategory}
        onCancel={() => setCatToDelete(null)}
      />
    </div>
  );
}
