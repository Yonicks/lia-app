/* Talki — service worker
   Strategy: precache the whole shell, serve cache-first (this app has no
   server data at all), and refresh the HTML in the background so a new
   deploy is picked up on the next launch. */

const VERSION = 'talki-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './audio-manager.js',
  './assets/audio/audio-logic.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      // addAll fails the whole install if any single file 404s, so add
      // them one at a time and tolerate misses (e.g. optional splash art)
      .then(cache => Promise.all(SHELL.map(url =>
        cache.add(new Request(url, { cache: 'reload' })).catch(() => null)
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Navigations: app shell for the PWA, but not for standalone pages
  // like privacy.html (required by the stores).
  if (req.mode === 'navigate') {
    const file = url.pathname.split('/').pop() || '';
    if (file && file !== 'index.html' && file.includes('.')) {
      event.respondWith(fetch(req).catch(() => caches.match(req)));
      return;
    }
    event.respondWith(
      caches.match('./index.html').then(cached => {
        const network = fetch(req)
          .then(res => {
            if (res && res.ok) caches.open(VERSION).then(c => c.put('./index.html', res.clone()));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Everything else: cache first, then network, and cache what comes back.
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.ok && (sameOrigin || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
