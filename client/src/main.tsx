import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set chart.js to use a dark stroke around every item
import Chart from 'chart.js/auto';

Chart.defaults.elements.arc.borderWidth = 1;
Chart.defaults.elements.arc.borderColor = '#fff';
Chart.defaults.font.family = "'Inter', sans-serif";

// Nota: la registrazione del service worker è gestita tramite register-sw.js in index.html

/**
 * NOTE SVILUPPATORE:
 * 
 * Accesso amministratore:
 * - Digitare "admin2024" sulla pagina principale
 * - Inserire codice: "nutri-admin-2024" nella finestra di dialogo
 */

createRoot(document.getElementById("root")!).render(<App />);
