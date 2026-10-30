/* お店ランチャー Service Worker
   ファイルを更新したら CACHE_VERSION の数字を上げる（古いキャッシュが捨てられる） */
const CACHE_VERSION = 'shop-launcher-v1';
const FILES = [
  './',
  './shop-launcher.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      Promise.all(FILES.map(f => cache.add(f).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 同じドメインのGETだけ扱う。ネット優先、ダメならキャッシュ（オフライン時用）
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./shop-launcher.html')))
  );
});
