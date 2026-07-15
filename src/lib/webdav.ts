// 账号本子 - WebDAV 客户端（适配坚果云）
// 基于 fetch 自实现轻量 WebDAV：MKCOL / PUT / GET / PROPFIND
// 坚果云 WebDAV 文档：https://help.jianguoyun.com/?p=2064
//
// 浏览器直接请求坚果云会被 CORS 拦截，通过腾讯云 SCF 代理转发。
// 云函数平台不支持 PROPFIND/MKCOL 等非标准 HTTP 方法，
// 因此前端统一用 POST，真实方法通过 X-Method 头传递。

import type { WebDavConfig } from '@/types';

const VAULT_FILE = 'vault.enc';

// 腾讯云 SCF 函数 URL
const PROXY_URL = 'https://1308213072-k1uz3b5r8c.ap-shanghai.tencentscf.com';

function normalizeServer(server: string): string {
  let s = server.trim();
  if (!s) return s;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  // 确保以 / 结尾
  if (!s.endsWith('/')) s += '/';
  return s;
}

function buildBase(config: WebDavConfig): string {
  return normalizeServer(config.server) + config.directory.replace(/^\/+|\/+$/g, '') + '/';
}

function authHeader(config: WebDavConfig): string {
  return 'Basic ' + btoa(config.username + ':' + config.password);
}

async function request(
  url: string,
  method: string,
  config: WebDavConfig,
  options: { body?: string; headers?: Record<string, string> } = {},
): Promise<Response> {
  // 统一用 POST 请求代理，真实方法和目标地址通过 header 传递
  // 60 秒超时，避免一直转圈
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const resp = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'X-Target-URL': url,
        'X-Method': method,
        Authorization: authHeader(config),
        'Content-Type': 'text/plain; charset=utf-8',
        ...options.headers,
      },
      body: options.body ?? '',
      signal: controller.signal,
    });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

/** 测试连接：尝试 PROPFIND 同步目录 */
export async function testConnection(
  config: WebDavConfig,
): Promise<{ ok: boolean; message: string }> {
  try {
    const base = buildBase(config);
    const resp = await request(base, 'PROPFIND', config, {
      headers: { Depth: '1', 'Content-Type': 'application/xml' },
      body: '<?xml version="1.0"?><propfind xmlns="DAV:"><prop><displayname/></prop></propfind>',
    });
    if (resp.status === 207) return { ok: true, message: '连接成功' };
    if (resp.status === 404) {
      // 目录不存在，尝试创建
      const mk = await request(base, 'MKCOL', config);
      if (mk.status === 201) return { ok: true, message: '连接成功（已创建同步目录）' };
      return { ok: false, message: `创建目录失败：${mk.status}` };
    }
    if (resp.status === 401) return { ok: false, message: '账号或应用专用密码错误' };
    return { ok: false, message: `服务器返回 ${resp.status}` };
  } catch (e) {
    return { ok: false, message: '网络错误：' + (e as Error).message };
  }
}

/** 上传加密保险库到坚果云 */
export async function uploadVault(
  config: WebDavConfig,
  data: string,
): Promise<{ ok: boolean; message: string }> {
  try {
    const base = buildBase(config);
    // 确保目录存在
    await request(base, 'MKCOL', config).catch(() => {});
    const resp = await request(base + VAULT_FILE, 'PUT', config, {
      body: data,
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    if (resp.ok || resp.status === 201 || resp.status === 204) {
      return { ok: true, message: '上传成功' };
    }
    return { ok: false, message: `上传失败：${resp.status}` };
  } catch (e) {
    return { ok: false, message: '网络错误：' + (e as Error).message };
  }
}

/** 从坚果云下载加密保险库 */
export async function downloadVault(
  config: WebDavConfig,
): Promise<{ ok: boolean; data: string | null; message: string }> {
  try {
    const base = buildBase(config);
    const resp = await request(base + VAULT_FILE, 'GET', config);
    if (resp.ok) {
      const data = await resp.text();
      return { ok: true, data, message: '下载成功' };
    }
    if (resp.status === 404) return { ok: true, data: null, message: '云端暂无数据' };
    return { ok: false, data: null, message: `下载失败：${resp.status}` };
  } catch (e) {
    return { ok: false, data: null, message: '网络错误：' + (e as Error).message };
  }
}

export { VAULT_FILE };
