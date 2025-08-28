const CACHE_NAME = 'prayer-times-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/adhan.mp3',
  '/icon-192x192.png',
  '/icon-512x512.png',
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
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Background sync for prayer time updates
self.addEventListener('sync', event => {
  if (event.tag === 'prayer-times-sync') {
    event.waitUntil(syncPrayerTimes());
  }
});

async function syncPrayerTimes() {
  try {
    const response = await fetch('/api/prayer-times');
    const prayerTimes = await response.json();
    
    // Store in cache
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/api/prayer-times', new Response(JSON.stringify(prayerTimes)));
    
    console.log('Prayer times synced successfully');
  } catch (error) {
    console.error('Failed to sync prayer times:', error);
  }
}

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll().then(clientList => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
