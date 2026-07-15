import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store';
import Layout from '@/components/Layout';
import Unlock from '@/pages/Unlock';
import Accounts from '@/pages/Accounts';
import AccountDetail from '@/pages/AccountDetail';
import AccountEdit from '@/pages/AccountEdit';
import SyncSettings from '@/pages/SyncSettings';
import Settings from '@/pages/Settings';

export default function App() {
  const init = useStore((s) => s.init);
  const initialized = useStore((s) => s.initialized);
  const unlocked = useStore((s) => s.unlocked);
  const location = useLocation();

  useEffect(() => {
    void init();
  }, [init]);

  // 加载中
  if (initialized === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500/20 border-t-amber-500" />
          <p className="text-sm text-cream-dim">正在加载保险库…</p>
        </div>
      </div>
    );
  }

  // 未初始化或未解锁 → 解锁页
  if (!initialized || !unlocked) {
    return <Unlock />;
  }

  // 已解锁但停留在解锁页 → 跳转主页
  if (location.pathname === '/unlock') {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Accounts />} />
        <Route path="/account/new" element={<AccountEdit />} />
        <Route path="/account/:id" element={<AccountDetail />} />
        <Route path="/account/:id/edit" element={<AccountEdit />} />
        <Route path="/sync" element={<SyncSettings />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
