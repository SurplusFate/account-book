// 账号本子 - 主题管理（日间 / 夜间 / 跟随系统）
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'ab_theme_mode';

type ResolvedTheme = 'dark' | 'light';

/** 系统是否正在使用浅色主题 */
function systemPrefersLight(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: light)').matches;
}

/** 将 theme mode 解析为最终生效的 dark/light */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return systemPrefersLight() ? 'light' : 'dark';
  return mode;
}

/** 从 localStorage 读取保存的主题模式，默认跟随系统 */
export function getStoredThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {
    /* ignore */
  }
  return 'system';
}

/** 保存主题模式到 localStorage */
export function saveThemeMode(mode: ThemeMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

/** 将解析后的实际主题应用到 DOM + Capacitor 状态栏 */
async function applyResolvedTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }

  const metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', resolved === 'light' ? '#FBF7EE' : '#0B0F0E');
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.setStyle({
        style: resolved === 'light' ? Style.Light : Style.Dark,
      });
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({
          color: resolved === 'light' ? '#FBF7EE' : '#0B0F0E',
        });
      }
    } catch (err) {
      console.warn('状态栏设置失败:', err);
    }
  }
}

/** 对系统主题变化的全局监听器（跟随系统模式下触发重算应用） */
let systemListener: ((e: MediaQueryListEvent) => void) | null = null;

function ensureSystemListener(currentMode: ThemeMode) {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  const mql = window.matchMedia('(prefers-color-scheme: light)');

  if (!systemListener) {
    systemListener = () => {
      // 只有当前处于 system 模式时才响应系统变化
      if (getStoredThemeMode() === 'system') {
        void applyResolvedTheme(resolveTheme('system'));
      }
    };
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', systemListener);
    } else if (typeof (mql as any).addListener === 'function') {
      (mql as any).addListener(systemListener);
    }
  }

  // 立即按当前设置同步一次
  void applyResolvedTheme(resolveTheme(currentMode));
}

/** 初始化主题：读取保存值并应用（用于应用启动时） */
export async function initTheme(): Promise<ThemeMode> {
  const mode = getStoredThemeMode();
  ensureSystemListener(mode);
  return mode;
}

/** 切换/设置主题模式（用于设置页）并持久化 */
export async function setThemeMode(next: ThemeMode): Promise<ThemeMode> {
  saveThemeMode(next);
  ensureSystemListener(next);
  return next;
}
