// Script per registrare il service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Aggiungiamo un piccolo ritardo per assicurarci che tutto sia caricato
    setTimeout(() => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registrato con successo:', window.location.href);
          
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
}