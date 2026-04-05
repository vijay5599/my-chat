const CACHE_NAME = 'my-chat-v2';
const ASSETS_TO_CACHE = [
  '/login',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force update
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.error('Initial caching failed:', err);
      });
    })
  );
});

// Listen for Push Events from the Server (Locked-App)
self.addEventListener('push', (event) => {
  let data = { title: 'New Message', body: 'Someone sent you a message!' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'New Message', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'new-message',
    renotify: true,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Skip non-GET, non-HTTP, and dynamic routes (/chat, /api, supabase)
  if (
    event.request.method !== 'GET' || 
    !event.request.url.startsWith('http') ||
    url.pathname.startsWith('/chat') ||
    url.pathname.startsWith('/api') ||
    url.hostname.includes('supabase')
  ) {
    return;
  }

  // 2. Performance: Respond with Cache then Network for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // Double check it's a valid response before returning
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          return networkResponse;
        })
        .catch((error) => {
          // If the network fails, we don't throw an error for navigation; we let it fail naturally
          console.error('Service Worker Fetch failed:', error);
          if (event.request.mode === 'navigate') {
            // Optional: return caches.match('/offline.html');
          }
          return undefined; // Allow browser to show default offline page
        });
    })
  );
});


// Self-activating to ensure new PWA settings apply immediately
// Self-activating to ensure new PWA settings apply immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes('/chat') && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open the app
      if (self.clients.openWindow) {
        return self.clients.openWindow('/chat');
      }
    })
  );
});
