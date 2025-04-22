/**
 * Servizio per l'invio di email di contatto
 * 
 * Questo servizio gestisce l'invio di email quando un utente compila il modulo di contatto.
 * Utilizza l'API di Brevo con l'implementazione fetch.
 */

import { InsertEmailResponse } from './email-response';

// Costante per l'URL API di Brevo
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Verifica che la chiave API sia disponibile
if (!process.env.BREVO_API_KEY) {
  console.error('BREVO_API_KEY non è definita nelle variabili di ambiente');
}

// Configurazione dei mittenti e destinatari
const adminEmail = "support@nutrieasy.eu";
const adminName = "Support NutriEasy";

// Funzione di utilità per inviare email tramite Brevo
async function sendEmail(to: string | string[], subject: string, htmlContent: string, textContent: string, replyTo?: {email: string, name: string}): Promise<boolean> {
  try {
    // Verifica che la chiave API sia disponibile
    if (!process.env.BREVO_API_KEY) {
      console.warn('BREVO_API_KEY non disponibile, impossibile inviare email');
      return false;
    }

    // Prepara il destinatario nel formato corretto
    const toArray = Array.isArray(to) 
      ? to.map(email => ({ email }))
      : [{ email: to }];

    // Configura i dati per l'invio
    const payload = {
      sender: { email: adminEmail, name: adminName },
      to: toArray,
      subject,
      htmlContent,
      textContent,
      replyTo: replyTo || { email: adminEmail, name: adminName }
    };

    // Invia la richiesta all'API di Brevo
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Errore API Brevo:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('Email inviata con successo tramite Brevo:', data);
    return true;
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email:', error);
    return false;
  }
}

// Funzione per inviare un'email di notifica all'amministratore quando arriva un messaggio dal modulo di contatto
export async function sendContactNotificationEmail(contactMessage: InsertEmailResponse): Promise<boolean> {
  try {
    const { email, subject, message } = contactMessage;

    // Configura il contenuto dell'email
    const emailSubject = `[Contatto Web] ${subject}`;
    
    // Contenuto HTML dell'email
    const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nuovo messaggio dal sito web</h1>
        </div>
        <div style="padding: 20px;">
          <p><strong>Da:</strong> ${email}</p>
          <p><strong>Oggetto:</strong> ${subject}</p>
          <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 15px 0;">
            <p style="white-space: pre-line;">${message}</p>
          </div>
          <p style="margin-top: 20px;">Per rispondere direttamente a questo messaggio, usa il pulsante "Rispondi" nella tua email.</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 10px; font-size: 12px; text-align: center; color: #777;">
          <p>NutriEasy - Sistema di notifica contatti</p>
        </div>
      </body>
    </html>
    `;

    // Contenuto testuale dell'email (per client che non supportano HTML)
    const textContent = `
    Nuovo messaggio dal sito web
    ---------------------------
    
    Da: ${email}
    Oggetto: ${subject}
    
    Messaggio:
    ${message}
    
    ---------------------------
    Per rispondere direttamente a questo messaggio, usa il pulsante "Rispondi" nella tua email.
    `;

    // Utilizza l'email del mittente come replyTo
    const replyTo = { 
      email: email, 
      name: email.split('@')[0] 
    };

    return await sendEmail(adminEmail, emailSubject, htmlContent, textContent, replyTo);
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email di notifica contatto:', error);
    return false;
  }
}

// Funzione per inviare una conferma di ricezione all'utente
export async function sendContactConfirmationEmail(email: string, subject: string): Promise<boolean> {
  try {
    // Configura il contenuto dell'email
    const emailSubject = `Conferma di ricezione: ${subject}`;
    
    // Contenuto HTML dell'email
    const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Abbiamo ricevuto il tuo messaggio</h1>
        </div>
        <div style="padding: 20px;">
          <p>Grazie per averci contattato.</p>
          <p>Questo è un messaggio automatico per confermare che abbiamo ricevuto la tua richiesta con oggetto: <strong>${subject}</strong>.</p>
          <p>Ti risponderemo il prima possibile.</p>
          <p>Cordiali saluti,<br>Il Team di NutriEasy</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 10px; font-size: 12px; text-align: center; color: #777;">
          <p>Hai ricevuto questa email perché hai utilizzato il modulo di contatto sul nostro sito. Se non hai inviato alcun messaggio, per favore ignora questa email.</p>
          <p>&copy; 2025 NutriEasy. Tutti i diritti riservati.</p>
        </div>
      </body>
    </html>
    `;

    // Contenuto testuale dell'email (per client che non supportano HTML)
    const textContent = `
    Abbiamo ricevuto il tuo messaggio
    
    Grazie per averci contattato.
    
    Questo è un messaggio automatico per confermare che abbiamo ricevuto la tua richiesta con oggetto: ${subject}.
    
    Ti risponderemo il prima possibile.
    
    Cordiali saluti,
    Il Team di NutriEasy
    
    ---
    Hai ricevuto questa email perché hai utilizzato il modulo di contatto sul nostro sito. 
    Se non hai inviato alcun messaggio, per favore ignora questa email.
    © 2025 NutriEasy. Tutti i diritti riservati.
    `;

    return await sendEmail(email, emailSubject, htmlContent, textContent);
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email di conferma contatto:', error);
    return false;
  }
}