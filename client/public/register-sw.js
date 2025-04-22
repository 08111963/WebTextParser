// Script per registrare il service worker con controllo di aggiornamento
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Prima controlliamo se c'è un service worker esistente e lo cancelliamo
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for(let registration of registrations) {
        // Aggiorna il service worker forzando l'unregister
        registration.unregister().then(boolean => {
          console.log('Service Worker precedente rimosso con successo');
        });
      }
      
      // Quindi registriamo il nuovo service worker
      setTimeout(() => {
        navigator.serviceWorker.register('/service-worker.js?v=3')
          .then(registration => {
            console.log('Service Worker registrato con successo:', window.location.href);
            
            // Forza l'aggiornamento continuo
            registration.update();
            
            // Imposta un intervallo per aggiornare il service worker
            setInterval(() => {
              registration.update();
              console.log('Service Worker aggiornato');
            }, 60 * 60 * 1000); // Aggiorna ogni ora
            
            // Controlla se la PWA può essere installata
            window.addEventListener('beforeinstallprompt', (e) => {
              // Previeni la visualizzazione predefinita
              e.preventDefault();
              // Salva l'evento per usarlo più tardi
              window.deferredPrompt = e;
              console.log('L\'app può essere installata');
            });
          })
          .catch(error => {
            console.log('Registrazione Service Worker fallita:', error);
          });
      }, 1000);
    });
  });
}