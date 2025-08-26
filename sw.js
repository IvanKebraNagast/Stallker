const CACHE = 'stallker-v1';
const ASSETS = [
  './stallker.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Mapové dlaždice nechajme mimo cache
  if (/tile\.openstreetmap\.org/.test(url.host)) return;

  // Cache-first pre app shell a CDN Leaflet
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      // do cache ukladaj iba same-origin (a necháme si aj Leaflet z CDN – už je v ASSETS)
      if (e.request.url.startsWith(self.location.origin)) {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => r))
  );
});
