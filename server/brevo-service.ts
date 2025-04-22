/**
 * Brevo Email Service
 * 
 * This service uses Brevo (formerly Sendinblue) to send emails.
 */

// Importiamo la definizione dei tipi
/// <reference path="./types/sib-api-v3-sdk.d.ts" />
import * as SibApiV3Sdk from 'sib-api-v3-sdk';

// Configurazione del client Brevo
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];

// Verifica che la chiave API sia disponibile
if (!process.env.BREVO_API_KEY) {
  console.error('BREVO_API_KEY non è definita nelle variabili di ambiente');
  throw new Error('BREVO_API_KEY missing');
}

apiKey.apiKey = process.env.BREVO_API_KEY;

// Inizializzazione API per invio email
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Inizializzazione dell'oggetto per l'invio delle email
const sender = {
  name: "NutriEasy",
  email: "support@nutrieasy.eu",
};

// Configurazione per email di risposta
const replyTo = {
  email: "support@nutrieasy.eu",
  name: "Support NutriEasy"
};

// Funzione per inviare un'email tramite Brevo
export async function sendEmailWithBrevo(
  to: string, 
  subject: string, 
  htmlContent: string, 
  textContent: string
): Promise<boolean> {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.replyTo = replyTo;
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;
    
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Email inviata con successo con Brevo:', response);
    return true;
  } catch (error) {
    console.error('Errore durante l\'invio dell\'email con Brevo:', error);
    return false;
  }
}

// Funzione per inviare un'email di benvenuto
export async function sendWelcomeEmailWithBrevo(email: string, username: string): Promise<boolean> {
  const subject = `Benvenuto su NutriEasy, ${username}!`;
  const htmlContent = `
    <html>
      <body>
        <h1>Benvenuto su NutriEasy, ${username}!</h1>
        <p>Grazie per esserti registrato. La tua prova gratuita di 5 giorni è iniziata.</p>
        <p>Con NutriEasy potrai:</p>
        <ul>
          <li>Tracciare i tuoi pasti e la tua alimentazione</li>
          <li>Ricevere consigli nutrizionali personalizzati</li>
          <li>Monitorare i tuoi progressi</li>
          <li>Generare piani alimentari</li>
        </ul>
        <p>Per iniziare, accedi alla tua dashboard e crea il tuo primo obiettivo nutrizionale.</p>
        <p>Cordiali saluti,<br>Il Team di NutriEasy</p>
      </body>
    </html>
  `;
  const textContent = `Benvenuto su NutriEasy, ${username}! Grazie per esserti registrato. La tua prova gratuita di 5 giorni è iniziata. Per iniziare, accedi alla tua dashboard e crea il tuo primo obiettivo nutrizionale. Cordiali saluti, Il Team di NutriEasy`;
  
  return sendEmailWithBrevo(email, subject, htmlContent, textContent);
}

// Funzione per inviare un'email di conferma pagamento
export async function sendPaymentConfirmationEmailWithBrevo(
  email: string, 
  username: string, 
  planName: string, 
  amount: string, 
  endDate: string
): Promise<boolean> {
  const subject = `Conferma di pagamento - ${planName}`;
  const htmlContent = `
    <html>
      <body>
        <h1>Conferma di pagamento</h1>
        <p>Ciao ${username},</p>
        <p>Grazie per il tuo abbonamento a NutriEasy!</p>
        <p>Dettagli del pagamento:</p>
        <ul>
          <li><strong>Piano:</strong> ${planName}</li>
          <li><strong>Importo:</strong> ${amount}</li>
          <li><strong>Valido fino al:</strong> ${endDate}</li>
        </ul>
        <p>Ora hai accesso completo a tutte le funzionalità premium di NutriEasy.</p>
        <p>Cordiali saluti,<br>Il Team di NutriEasy</p>
      </body>
    </html>
  `;
  const textContent = `Conferma di pagamento - Ciao ${username}, Grazie per il tuo abbonamento a NutriEasy! Dettagli del pagamento: Piano: ${planName}, Importo: ${amount}, Valido fino al: ${endDate}. Ora hai accesso completo a tutte le funzionalità premium di NutriEasy. Cordiali saluti, Il Team di NutriEasy`;
  
  return sendEmailWithBrevo(email, subject, htmlContent, textContent);
}

// Funzione per inviare un'email di avviso scadenza prova
export async function sendTrialExpiringEmailWithBrevo(
  email: string, 
  username: string, 
  daysLeft: number
): Promise<boolean> {
  const subject = `La tua prova gratuita di NutriEasy scadrà tra ${daysLeft} giorni`;
  const htmlContent = `
    <html>
      <body>
        <h1>La tua prova gratuita sta per scadere</h1>
        <p>Ciao ${username},</p>
        <p>Ti ricordiamo che la tua prova gratuita di NutriEasy scadrà tra ${daysLeft} giorni.</p>
        <p>Per continuare a utilizzare tutte le funzionalità, ti invitiamo a sottoscrivere un abbonamento.</p>
        <p>Visita la <a href="APP_URL/pricing">pagina dei prezzi</a> per vedere i nostri piani.</p>
        <p>Cordiali saluti,<br>Il Team di NutriEasy</p>
      </body>
    </html>
  `;
  const textContent = `La tua prova gratuita sta per scadere - Ciao ${username}, Ti ricordiamo che la tua prova gratuita di NutriEasy scadrà tra ${daysLeft} giorni. Per continuare a utilizzare tutte le funzionalità, ti invitiamo a sottoscrivere un abbonamento. Visita la pagina dei prezzi per vedere i nostri piani. Cordiali saluti, Il Team di NutriEasy`;
  
  return sendEmailWithBrevo(email, subject, htmlContent, textContent);
}

// Funzione per inviare un'email di abbonamento terminato
export async function sendSubscriptionEndedEmailWithBrevo(
  email: string, 
  username: string
): Promise<boolean> {
  const subject = `Il tuo abbonamento a NutriEasy è terminato`;
  const htmlContent = `
    <html>
      <body>
        <h1>Il tuo abbonamento è terminato</h1>
        <p>Ciao ${username},</p>
        <p>Ti informiamo che il tuo abbonamento a NutriEasy è terminato.</p>
        <p>Per rinnovare il tuo abbonamento e continuare a utilizzare tutte le funzionalità, visita la <a href="APP_URL/pricing">pagina dei prezzi</a>.</p>
        <p>Cordiali saluti,<br>Il Team di NutriEasy</p>
      </body>
    </html>
  `;
  const textContent = `Il tuo abbonamento è terminato - Ciao ${username}, Ti informiamo che il tuo abbonamento a NutriEasy è terminato. Per rinnovare il tuo abbonamento e continuare a utilizzare tutte le funzionalità, visita la pagina dei prezzi. Cordiali saluti, Il Team di NutriEasy`;
  
  return sendEmailWithBrevo(email, subject, htmlContent, textContent);
}

// Funzione per inviare un'email di reset password
export async function sendPasswordResetEmailWithBrevo(
  email: string, 
  username: string, 
  resetToken: string
): Promise<boolean> {
  const resetLink = `APP_URL/reset-password?token=${resetToken}`;
  const subject = `Reset della password - NutriEasy`;
  const htmlContent = `
    <html>
      <body>
        <h1>Reset della password</h1>
        <p>Ciao ${username},</p>
        <p>Abbiamo ricevuto una richiesta di reset della password per il tuo account.</p>
        <p>Per reimpostare la tua password, clicca sul seguente link:</p>
        <p><a href="${resetLink}">Reset della password</a></p>
        <p>Se non hai richiesto il reset della password, ignora questa email.</p>
        <p>Cordiali saluti,<br>Il Team di NutriEasy</p>
      </body>
    </html>
  `;
  const textContent = `Reset della password - Ciao ${username}, Abbiamo ricevuto una richiesta di reset della password per il tuo account. Per reimpostare la tua password, visita questo link: ${resetLink}. Se non hai richiesto il reset della password, ignora questa email. Cordiali saluti, Il Team di NutriEasy`;
  
  return sendEmailWithBrevo(email, subject, htmlContent, textContent);
}