self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Permite funcționarea online/offline lină
  e.respondWith(fetch(e.request).catch(() => new Response('Offline')));
});
