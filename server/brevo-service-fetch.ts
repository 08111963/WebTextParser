/**
 * Brevo Email Service - Implementazione con Fetch
 * 
 * Questo servizio utilizza le API di Brevo per inviare email utilizzando fetch API.
 */

// Costante per l'URL API di Brevo
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Verifica che la chiave API sia disponibile
if (!process.env.BREVO_API_KEY) {
  console.error('BREVO_API_KEY non è definita nelle variabili di ambiente');
}

// Inizializzazione dell'oggetto per l'invio delle email con dominio verificato
const sender = {
  name: "NutriEasy",
  email: "noreply@nutrieasy.eu",
};

// Funzione per inviare un'email tramite Brevo
export async function sendEmailWithBrevo(
  to: string, 
  subject: string, 
  htmlContent: string, 
  textContent: string
): Promise<boolean> {
  try {
    // Verifica che la chiave API sia disponibile
    if (!process.env.BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY non disponibile');
    }

    const payload = {
      sender,
      to: [{ email: to }],
      subject,
      htmlContent,
      textContent
    };

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
    console.log('Email inviata con successo con Brevo:', data);
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
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Benvenuto su NutriEasy, ${username}!</h1>
        </div>
        <div style="padding: 20px;">
          <p>Grazie per esserti registrato. La tua prova gratuita di 5 giorni è iniziata.</p>
          <p>Con NutriEasy potrai:</p>
          <ul>
            <li>Tracciare i tuoi pasti e la tua alimentazione</li>
            <li>Ricevere consigli nutrizionali personalizzati</li>
            <li>Monitorare i tuoi progressi</li>
            <li>Generare piani alimentari</li>
          </ul>
          <p>Per iniziare, <a href="https://nutrieasy.eu/home" style="color: #4CAF50; text-decoration: none; font-weight: bold;">accedi alla tua dashboard</a> e crea il tuo primo obiettivo nutrizionale.</p>
          <p>Cordiali saluti,<br>Il Team di NutriEasy</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 10px; font-size: 12px; text-align: center; color: #777;">
          <p>Hai ricevuto questa email perché ti sei registrato su NutriEasy. Se non desideri più ricevere le nostre comunicazioni, puoi <a href="https://nutrieasy.eu/unsubscribe?email=${email}" style="color: #777;">cancellare l'iscrizione</a>.</p>
          <p>&copy; 2025 NutriEasy. Tutti i diritti riservati.</p>
        </div>
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
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Conferma di pagamento</h1>
        </div>
        <div style="padding: 20px;">
          <p>Ciao ${username},</p>
          <p>Grazie per il tuo abbonamento a NutriEasy!</p>
          <p>Dettagli del pagamento:</p>
          <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
            <p><strong>Piano:</strong> ${planName}</p>
            <p><strong>Importo:</strong> ${amount}</p>
            <p><strong>Valido fino al:</strong> ${endDate}</p>
          </div>
          <p>Ora hai accesso completo a tutte le funzionalità premium di NutriEasy.</p>
          <p>Per iniziare a utilizzare tutte le funzionalità premium, <a href="https://nutrieasy.eu/home" style="color: #4CAF50; text-decoration: none; font-weight: bold;">accedi alla tua dashboard</a>.</p>
          <p>Cordiali saluti,<br>Il Team di NutriEasy</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 10px; font-size: 12px; text-align: center; color: #777;">
          <p>Hai ricevuto questa email perché sei un abbonato di NutriEasy. Se non desideri più ricevere le nostre comunicazioni, puoi <a href="https://nutrieasy.eu/unsubscribe?email=${email}" style="color: #777;">cancellare l'iscrizione</a>.</p>
          <p>&copy; 2025 NutriEasy. Tutti i diritti riservati.</p>
        </div>
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
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">La tua prova gratuita sta per scadere</h1>
        </div>
        <div style="padding: 20px;">
          <p>Ciao ${username},</p>
          <p>Ti ricordiamo che la tua prova gratuita di NutriEasy <strong>scadrà tra ${daysLeft} giorni</strong>.</p>
          <p>Per continuare a utilizzare tutte le funzionalità, ti invitiamo a sottoscrivere un abbonamento.</p>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #FF9800; padding: 15px; margin: 20px 0;">
            <p style="margin-top: 0;"><strong>Funzionalità premium che perderai:</strong></p>
            <ul>
              <li>Generazione di piani alimentari personalizzati</li>
              <li>Consigli nutrizionali avanzati</li>
              <li>Esportazione dei dati</li>
              <li>E molto altro...</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nutrieasy.eu/pricing" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">RINNOVA ORA</a>
          </div>
          
          <p>Cordiali saluti,<br>Il Team di NutriEasy</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 10px; font-size: 12px; text-align: center; color: #777;">
          <p>Hai ricevuto questa email perché sei in prova gratuita su NutriEasy. Se non desideri più ricevere le nostre comunicazioni, puoi <a href="https://nutrieasy.eu/unsubscribe?email=${email}" style="color: #777;">cancellare l'iscrizione</a>.</p>
          <p>&copy; 2025 NutriEasy. Tutti i diritti riservati.</p>
        </div>
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
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Il tuo abbonamento è terminato</h1>
        </div>
        <div style="padding: 20px;">
          <p>Ciao ${username},</p>
          <p>Ti informiamo che il tuo abbonamento a NutriEasy è terminato.</p>
          
          <div style="background-color: #f9f9f9; border-left: 4px solid #F44336; padding: 15px; margin: 20px 0;">
            <p style="margin-top: 0;"><strong>Funzionalità a cui non hai più accesso:</strong></p>
            <ul>
              <li>Generazione di piani alimentari personalizzati</li>
              <li>Consigli nutrizionali avanzati</li>
              <li>Esportazione dei dati</li>
              <li>E molto altro...</li>
            </ul>
          </div>
          
          <p>Per rinnovare il tuo abbonamento e continuare a utilizzare tutte le funzionalità:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nutrieasy.eu/pricing" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">RINNOVA ORA</a>
          </div>
          
          <p>Cordiali saluti,<br>Il Team di NutriEasy</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 10px; font-size: 12px; text-align: center; color: #777;">
          <p>Hai ricevuto questa email perché sei stato un abbonato di NutriEasy. Se non desideri più ricevere le nostre comunicazioni, puoi <a href="https://nutrieasy.eu/unsubscribe?email=${email}" style="color: #777;">cancellare l'iscrizione</a>.</p>
          <p>&copy; 2025 NutriEasy. Tutti i diritti riservati.</p>
        </div>
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
  const resetLink = `https://nutrieasy.eu/reset-password?token=${resetToken}`;
  const subject = `Reset della password - NutriEasy`;
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Reset della password</h1>
        </div>
        <div style="padding: 20px;">
          <p>Ciao ${username},</p>
          <p>Abbiamo ricevuto una richiesta di reset della password per il tuo account.</p>
          
          <div style="background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin-top: 0;"><strong>Per reimpostare la tua password:</strong></p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">REIMPOSTA PASSWORD</a>
            </div>
            <p style="color: #777; font-size: 13px;">Per motivi di sicurezza, questo link scadrà tra 24 ore.</p>
          </div>
          
          <p>Se non hai richiesto il reset della password, puoi ignorare questa email in tutta sicurezza.</p>
          
          <p>Cordiali saluti,<br>Il Team di NutriEasy</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 10px; font-size: 12px; text-align: center; color: #777;">
          <p>Questa è un'email di servizio inviata a seguito di una richiesta specifica. Per maggiori informazioni visita <a href="https://nutrieasy.eu/privacy" style="color: #777;">la nostra privacy policy</a>.</p>
          <p>&copy; 2025 NutriEasy. Tutti i diritti riservati.</p>
        </div>
      </body>
    </html>
  `;
  const textContent = `Reset della password - Ciao ${username}, Abbiamo ricevuto una richiesta di reset della password per il tuo account. Per reimpostare la tua password, visita questo link: ${resetLink}. Se non hai richiesto il reset della password, ignora questa email. Cordiali saluti, Il Team di NutriEasy`;
  
  return sendEmailWithBrevo(email, subject, htmlContent, textContent);
}