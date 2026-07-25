const CACHE_NAME = 'moonscout-v1';
const ASSETS = [
  './',
  './moonscout.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  // Ignore active subnet probe sweeps on port 7125
  if (event.request.url.includes(':7125')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
