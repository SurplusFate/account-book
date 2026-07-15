// 账号本子 - 账号卡片
import { useNavigate } from 'react-router-dom';
import { Pin, Star } from 'lucide-react';
import type { AccountItem } from '@/types';
import AccountIcon from '@/components/AccountIcon';
import { hostnameOf } from '@/lib/utils';

export default function AccountCard({ account }: { account: AccountItem }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/account/${account.id}`)}
      className="card group flex items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-amber-500/25 hover:shadow-card-hover"
    >
      <AccountIcon url={account.url} title={account.title} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium text-cream">{account.title || '未命名'}</h3>
          {account.pinned && (
            <Pin className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-cream-dim">
          {account.username || hostnameOf(account.url) || '—'}
        </p>
      </div>
      {account.favorite && (
        <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
      )}
    </button>
  );
}
