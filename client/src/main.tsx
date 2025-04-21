import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set chart.js to use a dark stroke around every item
import Chart from 'chart.js/auto';

Chart.defaults.elements.arc.borderWidth = 1;
Chart.defaults.elements.arc.borderColor = '#fff';
Chart.defaults.font.family = "'Inter', sans-serif";

// Registra il service worker per funzionalità PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrato con successo:', registration.scope);
      })
      .catch(error => {
        console.log('Registrazione Service Worker fallita:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
