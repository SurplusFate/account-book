/**
 * 腾讯云 SCF HTTP 函数 - WebDAV CORS 代理
 *
 * 前端统一用 POST 请求本函数，通过 X-Target-URL 和 X-Method 头
 * 传递真实的目标地址和 HTTP 方法（PROPFIND/MKCOL 等），
 * 避免云函数平台不支持非标准 HTTP 方法的问题。
 *
 * HTTP 函数通过 scf_bootstrap 启动 Node HTTP 服务器，监听指定端口。
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, Content-Type, Depth, X-Target-URL, X-Method, If-Match, If-None-Match, Overwrite, Destination, User-Agent, Accept',
  'Access-Control-Expose-Headers':
    'ETag, Last-Modified, Content-Length, Content-Type, DAV, Allow',
  'Access-Control-Max-Age': '86400',
};

const PORT = process.env.SCF_PORT || 9000;

function lowerKeys(obj) {
  const r = {};
  for (const [k, v] of Object.entries(obj)) r[k.toLowerCase()] = v;
  return r;
}

function doRequest(targetUrl, method, headers, bodyBuf) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const lib = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: method,
      headers: headers,
    };
    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        }),
      );
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('请求超时（30秒）')));
    if (bodyBuf && bodyBuf.length > 0) req.write(bodyBuf);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const headers = lowerKeys(req.headers);
  const targetUrl = headers['x-target-url'];
  const method = headers['x-method'] || req.method;

  // 写入 CORS 头
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.setHeader(k, v);
  }

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('缺少 X-Target-URL 请求头');
    return;
  }

  const skip = new Set([
    'x-target-url',
    'x-method',
    'host',
    'origin',
    'referer',
    'content-length',
    'connection',
    'accept-encoding',
  ]);
  const fwdHeaders = {};
  for (const [k, v] of Object.entries(headers)) {
    if (skip.has(k)) continue;
    fwdHeaders[k] = v;
  }

  // 读取请求体
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  let bodyBuf = Buffer.concat(chunks);
  if (bodyBuf.length === 0) bodyBuf = null;
  if (bodyBuf && method !== 'GET' && method !== 'HEAD') {
    fwdHeaders['content-length'] = String(bodyBuf.length);
  } else if (method === 'GET' || method === 'HEAD') {
    bodyBuf = null;
    delete fwdHeaders['content-length'];
  }

  try {
    const result = await doRequest(targetUrl, method, fwdHeaders, bodyBuf);
    // 设置响应头（目标服务器的头 + CORS 头）
    for (const [k, v] of Object.entries(result.headers)) {
      // 跳过会冲突的头
      if (k.toLowerCase() === 'transfer-encoding') continue;
      res.setHeader(k, v);
    }
    // 确保 CORS 头覆盖
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      res.setHeader(k, v);
    }
    res.writeHead(result.status);
    res.end(result.body);
  } catch (e) {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('代理转发失败: ' + (e.message || String(e)));
  }
});

server.listen(PORT, () => {
  console.log(`SCF proxy server listening on port ${PORT}`);
});
