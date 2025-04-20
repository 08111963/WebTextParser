/**
 * Email Service - Bridge tra TypeScript e il modulo Brevo helper in JavaScript
 */
import fs from 'fs';
import path from 'path';

// Definizione dei tipi per le funzioni di invio email
type EmailFunction = (email: string, username: string, ...args: any[]) => Promise<boolean>;

// Interfaccia per il servizio email
interface EmailService {
  sendWelcomeEmail: (email: string, username: string) => Promise<boolean>;
  sendPaymentConfirmationEmail: (email: string, username: string, planName: string, amount: string, endDate: string) => Promise<boolean>;
  sendTrialExpiringEmail: (email: string, username: string, daysLeft: number) => Promise<boolean>;
  sendSubscriptionEndedEmail: (email: string, username: string) => Promise<boolean>;
  sendPasswordResetEmail: (email: string, username: string, resetToken: string) => Promise<boolean>;
}

// Flag per verificare se il servizio email è disponibile
let isEmailServiceAvailable = false;
let emailServiceError: Error | null = null;

// Funzione per creare una funzione di fallback che simula l'invio di un'email
function createFallbackEmailFunction(emailType: string): EmailFunction {
  return async (email: string, username: string, ...args: any[]): Promise<boolean> => {
    console.log(`========== SIMULAZIONE EMAIL (${emailType}) ==========`);
    console.log(`Email: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Args:`, args);
    console.log('================================================');
    return true;
  };
}

// Servizio email predefinito con funzioni di fallback
const fallbackEmailService: EmailService = {
  sendWelcomeEmail: createFallbackEmailFunction('welcome'),
  sendPaymentConfirmationEmail: createFallbackEmailFunction('payment'),
  sendTrialExpiringEmail: createFallbackEmailFunction('trial'),
  sendSubscriptionEndedEmail: createFallbackEmailFunction('subscription'),
  sendPasswordResetEmail: createFallbackEmailFunction('password'),
};

// Verifica se la chiave API Brevo è configurata
const isBrevoConfigured = !!process.env.BREVO_API_KEY;

// Stato corrente del servizio
console.log(`[Email Service] Brevo API Key configurata: ${isBrevoConfigured ? 'Sì' : 'No'}`);

// Variabile che conterrà il servizio email (o il fallback)
let emailService: EmailService = fallbackEmailService;

// Se la chiave API Brevo è configurata, tenta di caricare il modulo brevo-helper
if (isBrevoConfigured) {
  try {
    console.log('[Email Service] Tentativo di importare il modulo brevo-helper...');
    
    // Verifica se il file esiste
    const brevoHelperPath = path.join(__dirname, 'brevo-helper.js');
    if (fs.existsSync(brevoHelperPath)) {
      console.log(`[Email Service] File brevo-helper.js trovato in: ${brevoHelperPath}`);
      
      // Importa il modulo direttamente con require
      const brevoModule = require('./brevo-helper.js');
      
      // Verifica che il modulo contenga le funzioni necessarie
      if (
        typeof brevoModule.sendWelcomeEmail === 'function' &&
        typeof brevoModule.sendPaymentConfirmationEmail === 'function' &&
        typeof brevoModule.sendTrialExpiringEmail === 'function' &&
        typeof brevoModule.sendSubscriptionEndedEmail === 'function' &&
        typeof brevoModule.sendPasswordResetEmail === 'function'
      ) {
        // Assegna il modulo Brevo al servizio email
        emailService = brevoModule;
        isEmailServiceAvailable = true;
        console.log('[Email Service] Modulo brevo-helper importato con successo!');
      } else {
        throw new Error('Il modulo brevo-helper non contiene tutte le funzioni richieste');
      }
    } else {
      throw new Error(`File brevo-helper.js non trovato in: ${brevoHelperPath}`);
    }
  } catch (error: any) {
    emailServiceError = error;
    console.error('[Email Service] Errore durante l\'importazione del modulo brevo-helper:', error);
    console.log('[Email Service] Utilizzo del servizio email di fallback');
  }
} else {
  console.log('[Email Service] Brevo API Key non configurata, utilizzo del servizio email di fallback');
}

// Esporta lo stato del servizio email e le funzioni
export const emailServiceStatus = {
  isAvailable: isEmailServiceAvailable,
  isConfigured: isBrevoConfigured,
  error: emailServiceError
};

// Esporta le funzioni del servizio email
export const {
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendTrialExpiringEmail,
  sendSubscriptionEndedEmail,
  sendPasswordResetEmail
} = emailService;