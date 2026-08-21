// 账号本子 - 主题管理（日间 / 夜间切换）
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'ab_theme';

/** 从 localStorage 读取保存的主题，默认深色（夜间模式） */
export function getStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  return 'dark';
}

/** 保存主题到 localStorage */
export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

/** 应用主题到 DOM：切换 <html> 根元素的 .light 类，同步 Capacitor 状态栏 */
export async function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }

  // 同步 meta theme-color，用于 PWA/浏览器地址栏
  const metaThemeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      theme === 'light' ? '#FBF7EE' : '#0B0F0E',
    );
  }

  // 同步 Capacitor 原生状态栏样式（仅原生平台）
  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.setStyle({
        style: theme === 'light' ? Style.Light : Style.Dark,
      });
      // Android 5+：设置状态栏背景色与 body 背景一致，避免反差
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({
          color: theme === 'light' ? '#FBF7EE' : '#0B0F0E',
        });
      }
    } catch (err) {
      console.warn('状态栏设置失败:', err);
    }
  }
}

/** 初始化主题：读取保存值并应用（用于应用启动时） */
export async function initTheme(): Promise<Theme> {
  const theme = getStoredTheme();
  await applyTheme(theme);
  return theme;
}

/** 切换主题并持久化 */
export async function toggleTheme(current: Theme): Promise<Theme> {
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  saveTheme(next);
  await applyTheme(next);
  return next;
}
