const CACHE = 'dino-mutant-v22';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './stories.json',
  './css/style.css',
  './js/app.js',
  './js/renderer.js',
  './js/wardrobe.js',
  './js/nursery.js',
  './js/town.js',
  './js/world.js',
  './js/firebase-config.js',
  './js/fsrest.js',
  './js/cloud.js',
  './js/social.js',
  './js/share.js',
  './js/manipulatives.js',
  './js/puzzles.js',
  './js/reading.js',
  './js/expedition.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// stories.json: network first so new stories arrive without an app update; the cached copy is the offline fallback.
function networkFirst(request) {
  return fetch(request)
    .then((res) => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
      }
      return res;
    })
    .catch(() => caches.match(request, { ignoreSearch: true }));
}

// Everything else: cache first; anything fetched successfully later (e.g. Google Fonts) is cached for offline use.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const path = new URL(e.request.url).pathname;
  if (path.endsWith('/admin.html') || path.endsWith('/admin.js') || path.endsWith('/diag.html') || path.endsWith('/diag.js')) return;
  if (path.endsWith('/stories.json')) {
    e.respondWith(networkFirst(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
