const CACHE_NAME = 'perinwatch-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './server.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install Event - Pre-caches core app assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Cleans up older deprecated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event Strategy: Try Network First, Fallback to Local Cache if Offline
self.addEventListener('fetch', (event) => {
  // Only handle standard local app requests
  if (event.request.mode === 'navigate' || event.request.url.includes(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Check if response is valid, clone it and put it in cache
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If the network request fails, look for the file inside the offline cache
          return caches.match(event.request);
        })
    );
  }
});
