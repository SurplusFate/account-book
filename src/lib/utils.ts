// 账号本子 - 通用工具函数
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** 合并 Tailwind 类名 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ---------- 密码生成器 ----------
const CHARSETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digit: '0123456789',
  symbol: '!@#$%^&*()-_=+[]{};:,.<>?/~',
};

export interface GeneratorOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digit: boolean;
  symbol: boolean;
}

export const DEFAULT_GEN_OPTIONS: GeneratorOptions = {
  length: 16,
  lower: true,
  upper: true,
  digit: true,
  symbol: true,
};

export function generatePassword(opts: GeneratorOptions): string {
  let pool = '';
  if (opts.lower) pool += CHARSETS.lower;
  if (opts.upper) pool += CHARSETS.upper;
  if (opts.digit) pool += CHARSETS.digit;
  if (opts.symbol) pool += CHARSETS.symbol;
  if (!pool) return '';
  const arr = new Uint32Array(opts.length);
  crypto.getRandomValues(arr);
  let result = '';
  for (let i = 0; i < opts.length; i++) {
    result += pool[arr[i] % pool.length];
  }
  return result;
}

// ---------- 密码强度评估 ----------
export function passwordStrength(pwd: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
} {
  if (!pwd) return { score: 0, label: '无' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 14) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) score++;
  const labels = ['很弱', '弱', '一般', '强', '很强'];
  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  return { score: clamped, label: labels[clamped] };
}

// ---------- 剪贴板 ----------
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ---------- Favicon ----------
export function faviconUrl(url: string): string {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return '';
  }
}

export function hostnameOf(url: string): string {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** 首字母大写取首字符，用于无 favicon 时的占位 */
export function initials(title: string): string {
  if (!title) return '?';
  return title.trim().slice(0, 1).toUpperCase();
}

// ---------- 时间格式化 ----------
export function formatTime(ts: number | null): string {
  if (!ts) return '从未';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function timeAgo(ts: number | null): string {
  if (!ts) return '从未';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  return `${day} 天前`;
}

// ---------- 拼音首字母搜索（简易实现，覆盖常见场景） ----------
// 简单策略：将中文按常用映射转拼音首字母；英文直接小写
const PINYIN_INITIAL: Record<string, string> = {
  社交: 'sj', 工作: 'gz', 财务: 'cw', 购物: 'gw', 其他: 'qt', 全部: 'qb', 收藏: 'sc',
};

export function toSearchable(text: string): string {
  if (!text) return '';
  let result = text.toLowerCase();
  for (const [cn, py] of Object.entries(PINYIN_INITIAL)) {
    result = result.split(cn).join(py);
  }
  return result;
}

export function matchesSearch(haystack: string, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return toSearchable(haystack).includes(q);
}
