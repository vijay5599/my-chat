const CACHE_NAME = 'my-chat-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/chat',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Pass-through for non-GET requests or requests from different origins
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found, else fetch from network
      return response || fetch(event.request).catch(() => {
        // Optional: Return a custom offline page or fallback icon
      });
    })
  );
});

// Self-activating to ensure new PWA settings apply immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
