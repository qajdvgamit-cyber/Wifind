// WiFind service worker: lets the app install on phones and open offline after the first visit.
// App files always come from the network first, so edits you save (for example in VS Code) show up on refresh.
const VERSION = 'wifind-v2';
const SHELL = [
  './', './index.html', './css/styles.css', './js/app.js', './manifest.webmanifest',
  './assets/wifind-mark.webp', './assets/wifind-logo.webp',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function saveCopy(key, res) {
  if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(key, copy)); }
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // The speed test must always measure the real network, never the cache.
  if (url.pathname.includes('/speedtest/')) return;
  // Pages: network first, saved copy when offline.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then((res) => saveCopy('./index.html', res)).catch(() => caches.match('./index.html')));
    return;
  }
  // App files: network first (checks for changes every time), saved copy when offline.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => saveCopy(req, res))
        .catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }
  // Google Fonts: saved copy first, refreshed in the background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
