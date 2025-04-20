/**
 * Email Service - Central manager for sending emails
 * 
 * Supports Resend API, SMTP service and development fallback
 */
import * as smtpService from './smtp-service';
import * as resendService from './resend-service';

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

// Check if Resend API key is configured
const isResendConfigured = !!process.env.RESEND_API_KEY;

// Configure the email service based on available providers
(async function configureEmailService() {
  try {
    // Priority: Resend API first, then SMTP, then fallback
    if (isResendConfigured) {
      try {
        console.log('[Email Service] Using Resend API as primary email service...');
        
        // Test Resend connection
        const testResult = await resendService.testResendConnection();
        if (testResult) {
          // Assign the Resend module to the email service
          emailService = resendService;
          isEmailServiceAvailable = true;
          emailServiceProvider = 'resend';
          console.log('[Email Service] Resend service configured successfully!');
        } else {
          throw new Error('Resend connection test failed');
        }
      } catch (error: any) {
        emailServiceError = error;
        console.error('[Email Service] Error configuring Resend:', error);
        
        // If Resend fails, try SMTP as fallback
        if (isSmtpConfigured) {
          try {
            console.log('[Email Service] Attempting to use SMTP as fallback...');
            
            // Test SMTP connection
            const smtpTest = await smtpService.testSMTPConnection();
            if (smtpTest) {
              emailService = smtpService;
              isEmailServiceAvailable = true;
              emailServiceProvider = 'smtp';
              console.log('[Email Service] SMTP service configured as fallback!');
            } else {
              throw new Error('SMTP connection test failed');
            }
          } catch (smtpError: any) {
            emailServiceError = smtpError;
            console.error('[Email Service] SMTP fallback also failed:', smtpError);
            console.log('[Email Service] Using email simulation service');
          }
        }
      }
    } else if (isSmtpConfigured) {
      // If Resend is not configured but SMTP is, use SMTP directly
      try {
        console.log('[Email Service] Resend not available, using SMTP service...');
        
        // Test SMTP connection
        const smtpTest = await smtpService.testSMTPConnection();
        if (smtpTest) {
          emailService = smtpService;
          isEmailServiceAvailable = true;
          emailServiceProvider = 'smtp';
          console.log('[Email Service] SMTP service configured successfully!');
        } else {
          throw new Error('SMTP connection test failed');
        }
      } catch (error: any) {
        emailServiceError = error;
        console.error('[Email Service] Error configuring SMTP service:', error);
        console.log('[Email Service] Using email simulation service');
      }
    } else {
      console.log('[Email Service] No email configuration found, using email simulation service');
    }
  } catch (error) {
    console.error('[Email Service] Unexpected error during configuration:', error);
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
  get isResendConfigured() { return isResendConfigured; },
  get error() { return emailServiceError; }
};

// Export all email sending functions
export function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  return emailService.sendWelcomeEmail(email, username);
}

export function sendPaymentConfirmationEmail(
  email: string, 
  username: string, 
  planName: string, 
  amount: string, 
  endDate: string
): Promise<boolean> {
  return emailService.sendPaymentConfirmationEmail(email, username, planName, amount, endDate);
}

export function sendTrialExpiringEmail(
  email: string, 
  username: string, 
  daysLeft: number
): Promise<boolean> {
  return emailService.sendTrialExpiringEmail(email, username, daysLeft);
}

export function sendSubscriptionEndedEmail(
  email: string, 
  username: string
): Promise<boolean> {
  return emailService.sendSubscriptionEndedEmail(email, username);
}

export function sendPasswordResetEmail(
  email: string, 
  username: string, 
  resetToken: string
): Promise<boolean> {
  return emailService.sendPasswordResetEmail(email, username, resetToken);
}