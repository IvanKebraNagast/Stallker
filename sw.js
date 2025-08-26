// Stallker PWA service worker
const CACHE = 'stallker-v3';

const ASSETS = [
  './index.html',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Leaflet (cache as app-shell; mapové dlaždice necháme na sieť)
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first pre app shell; dlaždice OSM nechať ísť na sieť.
// Pri navigácii bez internetu vrátime cached index.html.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Offline fallback pre navigácie
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Nekašuj mapové dlaždice
  if (/tile\.openstreetmap\.org$/.test(url.host)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        // Ulož len same-origin odpovede (CDN Leaflet už v ASSETS)
        if (event.request.url.startsWith(self.location.origin)) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return resp;
      });
    })
  );
});
