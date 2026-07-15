/**
 * Cloudflare Worker - WebDAV CORS 代理
 *
 * 该 Worker 作为 CORS 代理，将带有 X-Target-URL 头的请求转发到目标 URL，
 * 并在响应中添加 CORS 头，以解决浏览器的跨域限制。
 */

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
      return new Response("缺少 X-Target-URL 请求头", {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // 构建转发请求的头部，移除代理专用的头和 host 头
    const forwardedHeaders = new Headers();
    for (const [key, value] of request.headers.entries()) {
      // 跳过 X-Target-URL 和 host 头，不转发到目标服务器
      if (key.toLowerCase() === "x-target-url" || key.toLowerCase() === "host") {
        continue;
      }
      forwardedHeaders.set(key, value);
    }

    // 转发请求到目标 URL，保留原始的 method、headers 和 body
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: forwardedHeaders,
      body: request.body,
    });

    // 构建响应头，保留目标服务器的响应头并添加 CORS 头
    const responseHeaders = new Headers(response.headers);
    const cors = corsHeaders();
    for (const [key, value] of cors.entries()) {
      responseHeaders.set(key, value);
    }

    // 返回带有 CORS 头的响应
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  },
};

/**
 * 返回标准 CORS 响应头
 */
function corsHeaders(): Headers {
  return new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Headers": "*",
  });
}
