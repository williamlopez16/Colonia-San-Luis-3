// Service Worker for Convocatoria Fútbol PWA - Network First Strategy
const CACHE_NAME = 'convocatoria-v3';

self.addEventListener('install', () => {
  // Activate immediately without waiting for old tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Purge ALL older caches immediately to prevent serving stale JS bundles
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.info('[SW] Eliminando caché antiguo:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Never intercept Firestore, Google APIs, or non-origin requests
  if (url.origin !== self.location.origin) return;

  // NETWORK-FIRST STRATEGY: Always fetch latest version from the server first
  // This guarantees real-time code updates and sync between devices and incognito
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Only if network is completely down, serve from cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Red no disponible', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
