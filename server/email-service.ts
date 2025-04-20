/**
 * Email Service - Central manager for sending emails
 * 
 * Supports SMTP service and development fallback
 */
import * as smtpService from './smtp-service';

// Type definition for email sending functions
type EmailFunction = (email: string, username: string, ...args: any[]) => Promise<boolean>;

// Interface for email service
interface EmailService {
  sendWelcomeEmail: (email: string, username: string) => Promise<boolean>;
  sendPaymentConfirmationEmail: (email: string, username: string, planName: string, amount: string, endDate: string) => Promise<boolean>;
  sendTrialExpiringEmail: (email: string, username: string, daysLeft: number) => Promise<boolean>;
  sendSubscriptionEndedEmail: (email: string, username: string) => Promise<boolean>;
  sendPasswordResetEmail: (email: string, username: string, resetToken: string) => Promise<boolean>;
}

// Flags for checking if email service is available
let isEmailServiceAvailable = false;
let emailServiceError: Error | null = null;
let emailServiceProvider = 'fallback';

// Function to create a fallback function that simulates sending an email
function createFallbackEmailFunction(emailType: string): EmailFunction {
  return async (email: string, username: string, ...args: any[]): Promise<boolean> => {
    console.log(`========== EMAIL SIMULATION (${emailType}) ==========`);
    console.log(`Email: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Args:`, args);
    console.log('================================================');
    return true;
  };
}

// Default email service with fallback functions
const fallbackEmailService: EmailService = {
  sendWelcomeEmail: createFallbackEmailFunction('welcome'),
  sendPaymentConfirmationEmail: createFallbackEmailFunction('payment'),
  sendTrialExpiringEmail: createFallbackEmailFunction('trial'),
  sendSubscriptionEndedEmail: createFallbackEmailFunction('subscription'),
  sendPasswordResetEmail: createFallbackEmailFunction('password'),
};

// Variable that will contain the email service (or fallback)
let emailService: EmailService = fallbackEmailService;

// Check if SMTP configurations are available
const isSmtpConfigured = !!(
  process.env.SMTP_HOST && 
  process.env.SMTP_PORT && 
  process.env.SMTP_USER && 
  process.env.SMTP_PASSWORD
);

// Create a function to check if SMTP is working
async function checkAndConfigureSMTP() {
  if (isSmtpConfigured) {
    try {
      console.log('[Email Service] Testing SMTP connection...');
      const smtpTest = await smtpService.testSMTPConnection();
      
      if (smtpTest) {
        // Explicitly use the SMTP service as it works reliably
        emailService = smtpService;
        isEmailServiceAvailable = true;
        emailServiceProvider = 'smtp';
        console.log('[Email Service] SMTP service configured successfully!');
        return true;
      } else {
        throw new Error('SMTP connection test failed');
      }
    } catch (error) {
      emailServiceError = error instanceof Error ? error : new Error(String(error));
      console.error('[Email Service] Error configuring SMTP service:', error);
      return false;
    }
  } else {
    console.log('[Email Service] SMTP not configured');
    return false;
  }
}

// Initial configuration
(async function initializeService() {
  try {
    // First try to configure SMTP
    const smtpConfigured = await checkAndConfigureSMTP();
    
    if (!smtpConfigured) {
      console.log('[Email Service] Using email simulation service as fallback');
    }
  } catch (error) {
    console.error('[Email Service] Unexpected error during initialization:', error);
  } finally {
    // Log current service status
    console.log(`[Email Service] Configured provider: ${emailServiceProvider}`);
    console.log(`[Email Service] Service available: ${isEmailServiceAvailable ? 'Yes' : 'No'}`);
  }
})().catch(error => {
  console.error('[Email Service] Fatal initialization error:', error);
});

// Email service status and configuration
export const emailServiceStatus = {
  get isAvailable() { return isEmailServiceAvailable; },
  get provider() { return emailServiceProvider; },
  get isSmtpConfigured() { return isSmtpConfigured; },
  get error() { return emailServiceError; }
};

// Helper function to check if email service is ready
async function ensureEmailServiceReady(): Promise<boolean> {
  // If the service is already available, return true
  if (isEmailServiceAvailable) {
    return true;
  }
  
  // If SMTP was not initially configured successfully, try again
  if (isSmtpConfigured && emailServiceProvider === 'fallback') {
    return await checkAndConfigureSMTP();
  }
  
  return false;
}

// Export all email sending functions with on-demand configuration check
export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  await ensureEmailServiceReady();
  return emailService.sendWelcomeEmail(email, username);
}

export async function sendPaymentConfirmationEmail(
  email: string, 
  username: string, 
  planName: string, 
  amount: string, 
  endDate: string
): Promise<boolean> {
  await ensureEmailServiceReady();
  return emailService.sendPaymentConfirmationEmail(email, username, planName, amount, endDate);
}

export async function sendTrialExpiringEmail(
  email: string, 
  username: string, 
  daysLeft: number
): Promise<boolean> {
  await ensureEmailServiceReady();
  return emailService.sendTrialExpiringEmail(email, username, daysLeft);
}

export async function sendSubscriptionEndedEmail(
  email: string, 
  username: string
): Promise<boolean> {
  await ensureEmailServiceReady();
  return emailService.sendSubscriptionEndedEmail(email, username);
}

export async function sendPasswordResetEmail(
  email: string, 
  username: string, 
  resetToken: string
): Promise<boolean> {
  await ensureEmailServiceReady();
  return emailService.sendPasswordResetEmail(email, username, resetToken);
}