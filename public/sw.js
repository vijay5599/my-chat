const CACHE_NAME = 'my-chat-v1';
const ASSETS_TO_CACHE = [
  '/login',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use standard fetch and manually check for opaque/redirected responses if needed
      // but simpler to just use cache.addAll and ensure URLs are public.
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
    badge: '/icon-192.png',
    tag: data.tag || 'new-message',
    renotify: true,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension requests or other non-http schemes
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // If we have a valid response, return it
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Optional: Clone and cache new successful requests
          // let responseToCache = networkResponse.clone();
          // caches.open(CACHE_NAME).then((cache) => {
          //   cache.put(event.request, responseToCache);
          // });

          return networkResponse;
        })
        .catch((error) => {
          console.error('Fetch failed:', error);
          // Return a fallback or just let it fail naturally if it's not a navigation
          if (event.request.mode === 'navigate') {
            // Potential fallback for page navigation:
            // return caches.match('/offline.html');
          }
          // Do NOT return undefined, return the original error to let browser handle it
          throw error;
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
