# NutriEasy

NutriEasy è un'applicazione web avanzata per il tracciamento dei pasti e la pianificazione nutrizionale, con funzionalità basate sull'intelligenza artificiale per generare raccomandazioni personalizzate.

## Funzionalità Principali

- **Tracking dei Pasti**: Registra facilmente i tuoi pasti quotidiani
- **Obiettivi Nutrizionali**: Imposta e monitora obiettivi personalizzati
- **Suggerimenti AI**: Ricevi consigli nutrizionali basati sul tuo profilo
- **Modalità Demo**: Esplora l'app senza registrazione
- **Piattaforma Multilingue**: Supporto completo in inglese
- **Installazione PWA**: Utilizza l'app su qualsiasi dispositivo

## Tecnologie Utilizzate

- **Frontend**: React, TypeScript, TailwindCSS, ShadcnUI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL con Drizzle ORM
- **Autenticazione**: Sistema locale con protezione delle password
- **Pagamenti**: Integrazione Stripe per abbonamenti
- **Email**: Servizio email integrato con Brevo
- **Intelligenza Artificiale**: API OpenAI e Perplexity per raccomandazioni personalizzate

## Requisiti di Sistema

- Node.js 18+
- PostgreSQL
- Connessione Internet per le funzionalità AI

## Installazione e Setup

1. Clona il repository
2. Installa le dipendenze: `npm install`
3. Configura le variabili d'ambiente nel file `.env`
4. Avvia lo sviluppo locale: `npm run dev`

## Configurazione Variabili d'Ambiente

Per eseguire correttamente l'applicazione, devi configurare diverse API key in un file `.env`:

```
DATABASE_URL=...
OPENAI_API_KEY=...
PERPLEXITY_API_KEY=...
STRIPE_SECRET_KEY=...
VITE_STRIPE_PUBLIC_KEY=...
STRIPE_PRICE_ID_MONTHLY=...
STRIPE_PRICE_ID_YEARLY=...
BREVO_API_KEY=...
```

## Licenza

Tutti i diritti riservati © 2025 NutriEasy

## Contatti

Per informazioni e supporto: support@nutrieasy.eu