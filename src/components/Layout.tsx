// 账号本子 - 主布局（侧边导航 + 自动锁定）
import { useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookKey,
  ListChecks,
  CloudCog,
  Settings as SettingsIcon,
  Lock,
  Plus,
} from 'lucide-react';
import { useStore } from '@/store';
import { ToastContainer } from '@/components/Toast';

const NAV = [
  { to: '/', label: '账号', icon: ListChecks, end: true },
  { to: '/sync', label: '同步', icon: CloudCog, end: false },
  { to: '/settings', label: '设置', icon: SettingsIcon, end: false },
];

export default function Layout({ children }: { children: ReactNode }) {
  const vault = useStore((s) => s.vault);
  const lock = useStore((s) => s.lock);
  const touch = useStore((s) => s.touch);
  const navigate = useNavigate();

  const autoLockMinutes = vault?.settings.autoLockMinutes ?? 5;

  // 自动锁定：监听用户活动，超时锁定
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      touch();
      clearTimeout(timer);
      if (autoLockMinutes > 0) {
        timer = setTimeout(() => {
          lock();
        }, autoLockMinutes * 60 * 1000);
      }
    };
    const events = ['mousemove', 'keydown', 'click', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      clearTimeout(timer);
    };
  }, [autoLockMinutes, lock, touch]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 桌面侧边栏 */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-cream/8 bg-ink-900/40 backdrop-blur-sm md:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <BookKey className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-base font-semibold text-cream">账号本子</h1>
            <p className="text-[10px] uppercase tracking-widest text-cream-dim">
              Encrypted Vault
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-100 shadow-[inset_0_0_0_1px_rgba(232,177,74,0.2)]'
                    : 'text-cream-muted hover:bg-white/[0.03] hover:text-cream'
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4">
          <button
            onClick={() => navigate('/account/new')}
            className="btn-primary mb-2 w-full"
          >
            <Plus className="h-4 w-4" />
            新建账号
          </button>
          <button
            onClick={() => {
              lock();
              navigate('/unlock');
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-cream-dim transition-colors hover:bg-white/[0.03] hover:text-cream"
          >
            <Lock className="h-3.5 w-3.5" />
            立即锁定
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto min-h-full max-w-5xl px-4 py-6 pb-24 md:px-8 md:pb-8">
          {children}
        </div>
      </main>

      {/* 移动端底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-cream/10 bg-ink-950/90 backdrop-blur-md md:hidden">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                isActive ? 'text-amber-400' : 'text-cream-dim'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
        <NavLink
          to="/account/new"
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-amber-400"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 shadow-glow">
            <Plus className="h-4 w-4 text-ink-950" />
          </div>
        </NavLink>
      </nav>

      <ToastContainer />
    </div>
  );
}
