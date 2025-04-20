// Import del modulo Brevo (ex Sendinblue)
console.log('Inizializzazione del modulo Brevo...');
try {
  const SibApiV3Sdk = require('sib-api-v3-sdk');
  console.log('Modulo Brevo importato con successo');
} catch (error) {
  console.error('Errore durante l\'importazione del modulo Brevo:', error);
}
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Email di default per l'invio
const DEFAULT_SENDER = {
  email: 'noreply@nutrieasy.com',
  name: 'NutriEasy'
};

// Configurazione dell'SDK di Brevo
let apiInstance = null;

// Configurazione di Brevo
if (process.env.BREVO_API_KEY) {
  try {
    // Configurazione dell'API key
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    // Creazione dell'istanza dell'API
    apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    console.log('✓ Brevo API key configurata correttamente');
  } catch (error) {
    console.error('Errore durante la configurazione di Brevo:', error);
  }
} else {
  console.log('Brevo API key non configurata. Le email verranno solo simulate nei log.');
}

/**
 * Invia un'email utilizzando Brevo (ex Sendinblue)
 * Se la chiave API non è configurata, simula l'invio nei log
 */
async function sendEmail(options) {
  const { to, subject, text, html, from } = options;
  
  // Verifica i parametri
  if (!to || !subject || (!text && !html)) {
    console.error('Email non inviata: parametri mancanti', { to, subject });
    return false;
  }
  
  try {
    // Se la chiave API è configurata, invia l'email con Brevo
    if (apiInstance && process.env.BREVO_API_KEY) {
      // Crea il messaggio in formato Brevo/Sendinblue
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      // Imposta il mittente
      sendSmtpEmail.sender = {
        name: typeof from === 'string' ? 'NutriEasy' : DEFAULT_SENDER.name,
        email: typeof from === 'string' ? from : DEFAULT_SENDER.email
      };
      
      // Imposta il destinatario
      sendSmtpEmail.to = [{ email: to }];
      sendSmtpEmail.subject = subject;
      
      // Imposta il contenuto (HTML ha priorità su testo)
      if (html) {
        sendSmtpEmail.htmlContent = html;
      } else if (text) {
        sendSmtpEmail.textContent = text;
      }
      
      // Invia l'email
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`Email inviata con successo a ${to} tramite Brevo`);
      return true;
    } else {
      // Altrimenti, simula l'invio nei log
      console.log('========== SIMULAZIONE EMAIL ==========');
      console.log(`Da: ${typeof from === 'string' ? from : DEFAULT_SENDER.email}`);
      console.log(`A: ${to}`);
      console.log(`Oggetto: ${subject}`);
      console.log('Contenuto:');
      console.log(text || html);
      console.log('======================================');
      return true;
    }
  } catch (error) {
    console.error('Errore nell\'invio dell\'email:', error);
    return false;
  }
}

/**
 * Invia un'email di benvenuto all'utente
 */
async function sendWelcomeEmail(email, username) {
  const subject = 'Benvenuto in NutriEasy!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4CAF50; text-align: center;">Benvenuto in NutriEasy!</h1>
      <p>Ciao ${username},</p>
      <p>Grazie per esserti registrato a NutriEasy! Siamo entusiasti di averti a bordo.</p>
      <p>Con NutriEasy, puoi:</p>
      <ul>
        <li>Tracciare i tuoi pasti e il consumo di nutrienti</li>
        <li>Ricevere consigli nutrizionali personalizzati con l'aiuto dell'AI</li>
        <li>Monitorare i tuoi progressi verso i tuoi obiettivi</li>
        <li>Generare piani alimentari basati sulle tue preferenze</li>
      </ul>
      <p>Il tuo periodo di prova gratuito di 5 giorni è ora attivo. Puoi accedere a tutte le funzionalità premium.</p>
      <p>Se hai domande o hai bisogno di assistenza, non esitare a contattarci.</p>
      <p>Buon appetito!</p>
      <p>Il team di NutriEasy</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Invia una notifica di pagamento completato
 */
async function sendPaymentConfirmationEmail(email, username, planName, amount, endDate) {
  const subject = 'Conferma Abbonamento NutriEasy';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4CAF50; text-align: center;">Abbonamento Confermato!</h1>
      <p>Ciao ${username},</p>
      <p>Grazie per aver sottoscritto l'abbonamento a NutriEasy!</p>
      <p>Dettagli dell'abbonamento:</p>
      <ul>
        <li><strong>Piano:</strong> ${planName}</li>
        <li><strong>Importo:</strong> ${amount}</li>
        <li><strong>Data scadenza:</strong> ${endDate}</li>
      </ul>
      <p>Ora hai accesso completo a tutte le funzionalità premium di NutriEasy!</p>
      <p>Se hai domande o hai bisogno di assistenza, non esitare a contattarci.</p>
      <p>Buon appetito!</p>
      <p>Il team di NutriEasy</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Invia un avviso di scadenza del trial
 */
async function sendTrialExpiringEmail(email, username, daysLeft) {
  const subject = `Il tuo periodo di prova scade tra ${daysLeft} giorn${daysLeft === 1 ? 'o' : 'i'}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #FFA500; text-align: center;">Il tuo periodo di prova sta per scadere</h1>
      <p>Ciao ${username},</p>
      <p>Il tuo periodo di prova gratuito di NutriEasy scadrà tra ${daysLeft} giorn${daysLeft === 1 ? 'o' : 'i'}.</p>
      <p>Per continuare a utilizzare tutte le funzionalità premium, considera di sottoscrivere uno dei nostri piani di abbonamento:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://web-text-parser-timetraker.replit.app/pricing" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visualizza Piani</a>
      </div>
      <p>Se hai domande o hai bisogno di assistenza, non esitare a contattarci.</p>
      <p>Grazie per aver scelto NutriEasy!</p>
      <p>Il team di NutriEasy</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Invia una notifica di scadenza dell'abbonamento
 */
async function sendSubscriptionEndedEmail(email, username) {
  const subject = 'Il tuo abbonamento a NutriEasy è scaduto';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #FF6347; text-align: center;">Abbonamento Scaduto</h1>
      <p>Ciao ${username},</p>
      <p>Il tuo abbonamento a NutriEasy è scaduto.</p>
      <p>I tuoi dati saranno conservati per un periodo di tempo limitato, ma non potrai più accedere alle funzionalità premium.</p>
      <p>Per ripristinare l'accesso completo, rinnova il tuo abbonamento:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://web-text-parser-timetraker.replit.app/pricing" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Rinnova Abbonamento</a>
      </div>
      <p>Se hai domande o hai bisogno di assistenza, non esitare a contattarci.</p>
      <p>Speriamo di rivederti presto!</p>
      <p>Il team di NutriEasy</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Invia una email per il recupero password
 */
async function sendPasswordResetEmail(email, username, resetToken) {
  const resetLink = `https://web-text-parser-timetraker.replit.app/reset-password?token=${resetToken}`;
  const subject = 'Recupero Password NutriEasy';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4CAF50; text-align: center;">Recupero Password</h1>
      <p>Ciao ${username},</p>
      <p>Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account NutriEasy.</p>
      <p>Per reimpostare la password, clicca sul pulsante sottostante:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reimposta Password</a>
      </div>
      <p>Se non hai richiesto la reimpostazione della password, puoi ignorare questa email.</p>
      <p>Il link di reset è valido per 24 ore.</p>
      <p>Grazie!</p>
      <p>Il team di NutriEasy</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    html
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendTrialExpiringEmail,
  sendSubscriptionEndedEmail,
  sendPasswordResetEmail
};