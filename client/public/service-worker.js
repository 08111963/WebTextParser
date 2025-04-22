// Service Worker per NutriEasy PWA
const CACHE_NAME = 'nutrieasy-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-512x512.svg',
  '/icons/icon-192x192.svg'
];

console.log('Service Worker attivo e funzionante');

// Installazione del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Gestione delle richieste di rete
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Controlla se riceviamo una risposta valida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona la risposta
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});

// Gestione dell'attivazione
self.addEventListener('activate', event => {
  const cacheAllowlist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            // Se questo cache non è nella lista consentita, eliminalo
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Richiedi al client di usare questo service worker immediatamente
  return self.clients.claim();
});