/**
 * Cloudflare Worker - WebDAV CORS 代理
 *
 * 将带 X-Target-URL 头的请求转发到目标 URL，并在响应中添加 CORS 头，
 * 解决浏览器跨域限制（坚果云 WebDAV 不支持浏览器直接跨域访问）。
 *
 * 设计要点：
 * - CORS 头显式列出方法/头名，不使用 * 通配符（部分浏览器对 * 匹配
 *   Authorization 和非简单方法（PROPFIND/MKCOL）较严格）
 * - 请求体读取为 ArrayBuffer 再转发，避免流式 body 在 WebDAV 方法上的兼容问题
 * - 所有错误路径都带 CORS 头，确保浏览器能读到错误响应而非 CORS 报错
 */

const ALLOWED_METHODS =
  "GET, POST, PUT, DELETE, HEAD, OPTIONS, PROPFIND, MKCOL, MOVE, COPY, PATCH";

const ALLOWED_HEADERS =
  "Authorization, Content-Type, Depth, X-Target-URL, If-Match, If-None-Match, Overwrite, Destination, User-Agent, Accept, Range";

const EXPOSED_HEADERS =
  "ETag, Last-Modified, Content-Length, Content-Type, DAV, Allow";

export default {
  async fetch(request: Request): Promise<Response> {
    // 处理 OPTIONS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // 从请求头中获取目标 URL
    const targetUrl = request.headers.get("X-Target-URL");
    if (!targetUrl) {
      return corsResponse("缺少 X-Target-URL 请求头", 400);
    }

    try {
      // 构建转发请求的头部，移除代理专用头和会被目标服务器拒绝的头
      const forwardedHeaders = new Headers();
      const skipHeaders = new Set([
        "x-target-url",
        "host",
        "origin",
        "referer",
        "cf-connecting-ip",
        "cf-ipcountry",
        "cf-ray",
        "cf-visitor",
        "x-forwarded-for",
        "x-forwarded-proto",
        "x-real-ip",
      ]);
      for (const [key, value] of request.headers.entries()) {
        if (skipHeaders.has(key.toLowerCase())) continue;
        forwardedHeaders.set(key, value);
      }

      // 将请求体读取为 ArrayBuffer，避免流式 body 的兼容问题
      let body: ArrayBuffer | null = null;
      if (request.method !== "GET" && request.method !== "HEAD") {
        body = await request.arrayBuffer();
        if (body.byteLength === 0) body = null;
      }

      // 转发请求到目标 URL（30 秒超时，避免浏览器一直转圈）
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      let response: Response;
      try {
        response = await fetch(targetUrl, {
          method: request.method,
          headers: forwardedHeaders,
          body,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      // 读取响应体（避免直接转发流时响应头被锁定）
      const respBody = await response.arrayBuffer();

      // 构建响应头，保留目标服务器响应头并追加 CORS 头
      const responseHeaders = new Headers(response.headers);
      const cors = corsHeaders();
      for (const [key, value] of cors.entries()) {
        responseHeaders.set(key, value);
      }

      return new Response(respBody, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return corsResponse("代理转发失败：" + msg, 502);
    }
  },
};

/** 构建标准 CORS 响应头 */
function corsHeaders(): Headers {
  return new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Expose-Headers": EXPOSED_HEADERS,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  });
}

/** 返回带 CORS 头的文本响应（用于错误路径） */
function corsResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      ...Object.fromEntries(corsHeaders().entries()),
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
