const CACHE_NAME = 'bfit-cache-v114';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './vendor/supabase-2.118.0.js',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-blue.png',
  './icon-petrol.png',
  './icon-mov.png',
  './icon-red.png',
  './icon-green.png',
  './icon-graphite.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // cache: 'reload' ocolește cache-ul HTTP (GitHub Pages: max-age=600), ca să nu salvăm o versiune veche
      return cache.addAll(ASSETS_TO_CACHE.map((url) => new Request(url, { cache: 'reload' })));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Notificări push: mesajul vine criptat de la Worker-ul B-Fit, cu titlul și textul deja compuse
self.addEventListener('push', (event) => {
  let m = {};
  try { m = event.data ? event.data.json() : {}; } catch (e) {}
  event.waitUntil(self.registration.showNotification(m.titlu || 'B-Fit', {
    body: m.corp || '',
    tag: m.tag || undefined,
    data: { url: m.url || './' }
  }));
});

// Atingerea notificării: aplicația deschisă trece în prim-plan cu panoul de notificări; altfel se deschide
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || './', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ferestre) => {
    const deschisa = ferestre.find((f) => f.url.startsWith(self.registration.scope));
    if (deschisa) {
      deschisa.postMessage({ tip: 'deschide-notificari' });
      return deschisa.focus();
    }
    return self.clients.openWindow(url);
  }));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cererile către backend-ul Supabase și către Worker-ul pozelor (R2) merg exclusiv prin rețea
  if (url.hostname.includes('supabase.co') || url.hostname.endsWith('workers.dev')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Pagina (index.html): întâi rețeaua, ca o versiune nouă publicată să apară de la prima deschidere;
  // copia din cache rămâne doar pentru offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Strategie Stale-While-Revalidate pentru resursele statice (GitHub Pages);
  // no-cache = verifică mereu cu serverul în loc să folosească o copie HTTP de până la 10 minute
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback offline silențios dacă lipsește conexiunea
        });

      return cachedResponse || fetchPromise;
    })
  );
});