const CACHE_NAME = 'perinwatch-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './admin.html', // Caches the Server Admin panel as well if applicable
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install service worker and cache core web shell resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PERINWATCH: Pre-caching core structural shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate service worker and clear obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('PERINWATCH: Removing deprecated cache instance:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch network request management (Stale-While-Revalidate Strategy for local files)
self.addEventListener('fetch', (event) => {
  // Only handle local site asset intercepts (Ignore global Firebase APIs / external video embeds)
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          // Offline fallback logic
          return cachedResponse;
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
