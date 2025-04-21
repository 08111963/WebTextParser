// Service Worker temporaneamente disabilitato per risolvere problemi con i messaggi di installazione
// Manteniamo solo uno stub minimo per evitare errori

// Questo service worker non farà nulla, ma rimarrà registrato
// così non ci saranno errori di caricamento nell'applicazione
console.log('Service Worker temporaneamente disabilitato');

// Gestiamo comunque l'evento fetch per evitare errori
self.addEventListener('fetch', event => {
  // Semplicemente lasciamo che la richiesta passi attraverso la rete normale
  // senza alcuna logica di caching o PWA
  return;
});

// Gestiamo gli altri eventi per completezza
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});