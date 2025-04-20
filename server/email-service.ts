/**
 * Email Service - Gestore centralizzato per l'invio di email
 * 
 * Supporta sia il servizio SMTP che il fallback di sviluppo
 */
import fs from 'fs';
import path from 'path';
import * as smtpService from './smtp-service';

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
let emailServiceProvider = 'fallback';

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

// Variabile che conterrà il servizio email (o il fallback)
let emailService: EmailService = fallbackEmailService;

// Verifica se le configurazioni SMTP sono disponibili
const isSmtpConfigured = !!(
  process.env.SMTP_HOST && 
  process.env.SMTP_PORT && 
  process.env.SMTP_USER && 
  process.env.SMTP_PASSWORD
);

// Verifica se la chiave API Brevo è configurata
const isBrevoConfigured = !!process.env.BREVO_API_KEY;

// Priorità: SMTP prima, poi Brevo API, infine fallback
if (isSmtpConfigured) {
  try {
    console.log('[Email Service] Configurazione SMTP trovata, utilizzo del servizio SMTP...');
    
    // Verifica che il modulo SMTP contenga le funzioni necessarie
    if (
      typeof smtpService.sendWelcomeEmail === 'function' &&
      typeof smtpService.sendPaymentConfirmationEmail === 'function' &&
      typeof smtpService.sendTrialExpiringEmail === 'function' &&
      typeof smtpService.sendSubscriptionEndedEmail === 'function' &&
      typeof smtpService.sendPasswordResetEmail === 'function'
    ) {
      // Assegna il modulo SMTP al servizio email
      emailService = smtpService;
      isEmailServiceAvailable = true;
      emailServiceProvider = 'smtp';
      console.log('[Email Service] Servizio SMTP configurato con successo!');
    } else {
      throw new Error('Il modulo SMTP non contiene tutte le funzioni richieste');
    }
  } catch (error: any) {
    emailServiceError = error;
    console.error('[Email Service] Errore durante la configurazione del servizio SMTP:', error);
    console.log('[Email Service] Tentativo di utilizzare Brevo API come fallback...');
    
    // Se SMTP fallisce, prova con Brevo API
    if (isBrevoConfigured) {
      try {
        // Verifica se il file esiste
        const brevoHelperPath = path.join(__dirname, 'brevo-helper.js');
        if (fs.existsSync(brevoHelperPath)) {
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
            emailServiceProvider = 'brevo';
            console.log('[Email Service] Modulo brevo-helper configurato come fallback!');
          } else {
            throw new Error('Il modulo brevo-helper non contiene tutte le funzioni richieste');
          }
        } else {
          throw new Error(`File brevo-helper.js non trovato in: ${brevoHelperPath}`);
        }
      } catch (error: any) {
        emailServiceError = error;
        console.error('[Email Service] Errore durante la configurazione di Brevo:', error);
        console.log('[Email Service] Utilizzo del servizio email di simulazione');
      }
    }
  }
} else if (isBrevoConfigured) {
  // Se SMTP non è configurato ma Brevo sì, usa Brevo direttamente
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
        emailServiceProvider = 'brevo';
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
  console.log('[Email Service] Nessuna configurazione email trovata, utilizzo del servizio email di simulazione');
}

// Stato corrente del servizio
console.log(`[Email Service] Provider configurato: ${emailServiceProvider}`);
console.log(`[Email Service] Servizio disponibile: ${isEmailServiceAvailable ? 'Sì' : 'No'}`);

// Esporta lo stato del servizio email e le funzioni
export const emailServiceStatus = {
  isAvailable: isEmailServiceAvailable,
  provider: emailServiceProvider,
  isSmtpConfigured,
  isBrevoConfigured,
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