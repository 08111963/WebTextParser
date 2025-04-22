/**
 * Servizio per l'invio di email di contatto
 * 
 * Questo servizio gestisce l'invio di email quando un utente compila il modulo di contatto.
 */

import { InsertEmailResponse } from './email-response';
import * as SibApiV3Sdk from 'sib-api-v3-sdk';

// Configurazione del client Brevo
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];

// Verifica che la chiave API sia disponibile
if (!process.env.BREVO_API_KEY) {
  console.error('BREVO_API_KEY non è definita nelle variabili di ambiente');
}

apiKey.apiKey = process.env.BREVO_API_KEY || '';

// Inizializzazione API per invio email
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Configurazione dei mittenti e destinatari
const adminEmail = "support@nutrieasy.eu";
const adminName = "Support NutriEasy";

// Funzione per inviare un'email di notifica all'amministratore quando arriva un messaggio dal modulo di contatto
export async function sendContactNotificationEmail(contactMessage: InsertEmailResponse): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn('BREVO_API_KEY non disponibile, impossibile inviare email di notifica contatto');
      return false;
    }

    const { email, subject, message } = contactMessage;

    // Creiamo l'oggetto per l'invio dell'email
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    // Configura i mittenti e destinatari
    sendSmtpEmail.sender = { email: adminEmail, name: adminName };
    sendSmtpEmail.to = [{ email: adminEmail, name: adminName }];
    // Il replyTo non è supportato in questa versione del tipo, lo aggiungiamo come parametro generico
    (sendSmtpEmail as any).replyTo = { email: email, name: email.split('@')[0] };
    
    // Configura il contenuto dell'email
    const emailSubject = `[Contatto Web] ${subject}`;
    sendSmtpEmail.subject = emailSubject;
    
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

    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;

    // Aggiunta dell'ID univoco per tracciare la conversazione
    const messageId = `contact-${Date.now()}@nutrieasy.eu`;
    // Il campo headers non è supportato in questa versione del tipo, lo aggiungiamo come parametro generico
    (sendSmtpEmail as any).headers = { 
      "Message-ID": messageId,
      "X-Contact-Form-ID": messageId,
      "In-Reply-To": messageId
    };

    // Invio dell'email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email di notifica contatto inviata con successo:', result);
    return true;
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email di notifica contatto:', error);
    return false;
  }
}

// Funzione per inviare una conferma di ricezione all'utente
export async function sendContactConfirmationEmail(email: string, subject: string): Promise<boolean> {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.warn('BREVO_API_KEY non disponibile, impossibile inviare email di conferma contatto');
      return false;
    }

    // Creiamo l'oggetto per l'invio dell'email
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    // Configura i mittenti e destinatari
    sendSmtpEmail.sender = { email: adminEmail, name: adminName };
    sendSmtpEmail.to = [{ email }];
    // Il replyTo non è supportato in questa versione del tipo, lo aggiungiamo come parametro generico
    (sendSmtpEmail as any).replyTo = { email: adminEmail, name: adminName };
    
    // Configura il contenuto dell'email
    sendSmtpEmail.subject = `Conferma di ricezione: ${subject}`;
    
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

    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;

    // Invio dell'email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email di conferma contatto inviata con successo:', result);
    return true;
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email di conferma contatto:', error);
    return false;
  }
}