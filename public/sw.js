/* 账号本子 - Service Worker
 * 提供离线缓存与 PWA 安装能力。升级缓存时修改 CACHE_VERSION 即可。
 */
const CACHE_VERSION = 'v1';
const APP_CACHE = `account-book-${CACHE_VERSION}`;
const SHELL_URLS = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== APP_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // 导航请求：网络优先，离线时回退到缓存的 App Shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(APP_CACHE).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() =>
          caches.match('./index.html').then((cached) => cached || caches.match('./')),
        ),
    );
    return;
  }

  // 同源静态资源（hash 文件名不可变）+ 跨源字体：缓存优先
  const cacheable =
    url.origin === self.location.origin ||
    request.destination === 'font' ||
    request.destination === 'style';

  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && (request.destination !== 'font' || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(APP_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
