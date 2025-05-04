# Guida alla Configurazione di NutriEasy

Questa guida dettagliata spiega come configurare tutte le API e i servizi esterni necessari per il funzionamento completo di NutriEasy.

## Database PostgreSQL

1. Crea un database PostgreSQL
2. Configura la variabile d'ambiente `DATABASE_URL` con la stringa di connessione

## OpenAI API

1. Vai su [OpenAI Platform](https://platform.openai.com/)
2. Crea un account e genera una API key
3. Imposta `OPENAI_API_KEY`, `OPENAI_API_KEY_GOALS`, e `OPENAI_API_KEY_MEALS` nel file .env

## Perplexity API

1. Registrati su [Perplexity](https://www.perplexity.ai/)
2. Genera una API key dal tuo account
3. Imposta `PERPLEXITY_API_KEY` nel file .env

## Stripe (Pagamenti)

1. Crea un account su [Stripe](https://stripe.com/)
2. Dal dashboard Stripe, ottieni:
   - API Key pubblica: `VITE_STRIPE_PUBLIC_KEY` (inizia con `pk_`)
   - API Key segreta: `STRIPE_SECRET_KEY` (inizia con `sk_`)
3. Crea due prodotti in Stripe per gli abbonamenti:
   - Piano mensile ($3.99): copia l'ID del prezzo come `STRIPE_PRICE_ID_MONTHLY`
   - Piano annuale ($39.99): copia l'ID del prezzo come `STRIPE_PRICE_ID_YEARLY`
4. Configura il webhook Stripe per gestire gli eventi di pagamento

## Brevo API (Email)

1. Registrati su [Brevo](https://www.brevo.com/)
2. Genera una API key per integrare il servizio email
3. Configura `BREVO_API_KEY` nel file .env
4. Configura anche i parametri SMTP se necessario:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`

## Configurazione delle Impostazioni di Sessione

Genera una stringa casuale sicura per la chiave di sessione:
```
SESSION_SECRET=una_stringa_casuale_lunga_e_sicura
```

## Note sulla Sicurezza

- Non condividere mai le chiavi API o le credenziali
- Utilizza variabili d'ambiente per le configurazioni sensibili
- Assicurati che il file `.env` sia incluso nel `.gitignore`
- Considera l'utilizzo di servizi come Doppler o GitHub Secrets per la gestione sicura delle credenziali

## Verifica dell'Installazione

Dopo aver configurato tutte le variabili, esegui:
```
npm run dev
```

L'applicazione dovrebbe avviarsi correttamente e tutte le funzionalità (AI, pagamenti, email) dovrebbero essere operative.