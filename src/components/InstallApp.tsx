// 账号本子 - 安装到桌面引导
import { useEffect, useState } from 'react';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/Toast';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast('已安装到桌面', 'success');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
      setDeferred(null);
    }
  }

  if (installed) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
        <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-amber-400" />
        <div className="flex-1">
          <div className="text-sm text-cream">已安装为 App</div>
          <div className="mt-0.5 text-xs text-cream-dim">
            可像原生应用一样从桌面图标打开
          </div>
        </div>
      </div>
    );
  }

  if (deferred) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-cream/10 bg-white/[0.02] px-4 py-3">
        <Smartphone className="h-4.5 w-4.5 shrink-0 text-amber-400" />
        <div className="flex-1">
          <div className="text-sm text-cream">安装到桌面</div>
          <div className="mt-0.5 text-xs text-cream-dim">
            获得独立图标与全屏 App 体验，支持离线
          </div>
        </div>
        <button onClick={handleInstall} className="btn-primary shrink-0 !px-4 !py-2">
          <Download className="h-4 w-4" />
          安装
        </button>
      </div>
    );
  }

  // 浏览器未提供安装提示（如 iOS Safari）：给出手动引导
  return (
    <div className="flex items-start gap-3 rounded-xl border border-cream/10 bg-white/[0.02] px-4 py-3">
      <Smartphone className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-400" />
      <div className="flex-1">
        <div className="text-sm text-cream">安装到桌面</div>
        <div className="mt-1 space-y-1 text-xs leading-relaxed text-cream-dim">
          <p>安卓：浏览器菜单「添加到主屏幕」；</p>
          <p>iPhone：Safari 分享按钮 →「添加到主屏幕」。</p>
        </div>
      </div>
    </div>
  );
}
