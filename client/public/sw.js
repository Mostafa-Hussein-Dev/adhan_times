const CACHE_NAME = 'prayer-times-v2';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/adhan.mp3',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html' // Create this file
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Enhanced fetch with better offline support
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    // API requests - cache with network first strategy
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request);
        })
    );
  } else {
    // Static resources - cache first strategy
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
        })
    );
  }
});

// Background sync for settings
self.addEventListener('sync', event => {
  if (event.tag === 'settings-sync') {
    event.waitUntil(syncSettings());
  }
});

async function syncSettings() {
  try {
    // This would be called when connectivity is restored
    console.log('Background sync for settings triggered');
    // The actual sync logic is handled in the React hooks
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Update cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});