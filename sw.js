/* AI × 经济日报 Service Worker
 * 策略:
 *   - HTML 页面: network-first（始终拿最新，失败回退 cache）
 *   - 静态资源 (CSS/JS/SVG/PNG): cache-first（命中即用）
 *   - 其它: stale-while-revalidate（先返回 cache，再后台更新）
 *
 * 缓存版本：v1
 * 更新：升级时修改 CACHE_NAME 即可触发后台更新
 */

const CACHE_NAME = 'ai-daily-report-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './history.html',
  './favicon.svg',
  './apple-touch-icon.svg',
  './og-image.svg',
  './manifest.webmanifest',
  './assets/css/site.css',
  './assets/js/site.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // HTML：network-first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then(function (resp) {
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put(req, clone); });
        return resp;
      }).catch(function () {
        return caches.match(req).then(function (cached) {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }

  // 静态资源：cache-first
  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (resp) {
        if (!resp || resp.status !== 200 || resp.type === 'opaque') return resp;
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put(req, clone); });
        return resp;
      });
    })
  );
});
