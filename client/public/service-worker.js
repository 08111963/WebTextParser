// Service Worker per NutriEasy PWA
const CACHE_NAME = 'nutrieasy-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-512x512.svg',
  '/icons/icon-192x192.svg',
  '/qrcodes/android_install_qrcode.png',
  '/qrcodes/ios_install_qrcode.png'
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

// Gestione delle richieste di rete con strategia network-first per pagine HTML
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Se è una richiesta di una pagina HTML o l'homepage, usa network-first
  if (requestUrl.pathname === '/' || 
      requestUrl.pathname.endsWith('.html') ||
      requestUrl.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clona la risposta per il caching
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Se la rete fallisce, prova a usare la cache
          return caches.match(event.request);
        })
    );
  } else {
    // Per tutte le altre richieste, usa cache-first
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - return response
          if (response) {
            // Aggiorna anche in background
            fetch(event.request).then(freshResponse => {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, freshResponse);
              });
            }).catch(() => {});
            return response;
          }
          
          // Se non c'è nella cache, recupera dalla rete
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
  }
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