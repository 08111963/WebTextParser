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
let resendTestResult = false;
let smtpTestResult = false;

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
let backupEmailService: EmailService | null = null;

// Check if configurations are available
const isResendConfigured = !!process.env.RESEND_API_KEY;
const isSmtpConfigured = !!(
  process.env.SMTP_HOST && 
  process.env.SMTP_PORT && 
  process.env.SMTP_USER && 
  process.env.SMTP_PASSWORD
);

// Configure Resend API service
async function checkAndConfigureResend(): Promise<boolean> {
  if (!isResendConfigured) {
    console.log('[Email Service] Resend API key not configured');
    return false;
  }
  
  try {
    console.log('[Email Service] Testing Resend API connection...');
    const testResult = await resendService.testResendConnection();
    resendTestResult = testResult;
    
    if (testResult) {
      emailService = resendService;
      isEmailServiceAvailable = true;
      emailServiceProvider = 'resend';
      console.log('[Email Service] Resend service configured successfully!');
      return true;
    } else {
      throw new Error('Resend connection test failed');
    }
  } catch (error) {
    emailServiceError = error instanceof Error ? error : new Error(String(error));
    console.error('[Email Service] Error configuring Resend service:', error);
    return false;
  }
}

// Configure SMTP service
async function checkAndConfigureSMTP(): Promise<boolean> {
  if (!isSmtpConfigured) {
    console.log('[Email Service] SMTP not configured');
    return false;
  }
  
  try {
    console.log('[Email Service] Testing SMTP connection...');
    const testResult = await smtpService.testSMTPConnection();
    smtpTestResult = testResult;
    
    if (testResult) {
      // If we don't have a primary email service yet, set SMTP as primary
      if (!isEmailServiceAvailable) {
        emailService = smtpService;
        isEmailServiceAvailable = true;
        emailServiceProvider = 'smtp';
        console.log('[Email Service] SMTP service configured as primary!');
      } else {
        // Otherwise, set as backup
        backupEmailService = smtpService;
        console.log('[Email Service] SMTP service configured as backup!');
      }
      return true;
    } else {
      throw new Error('SMTP connection test failed');
    }
  } catch (error) {
    if (!isEmailServiceAvailable) {
      emailServiceError = error instanceof Error ? error : new Error(String(error));
    }
    console.error('[Email Service] Error configuring SMTP service:', error);
    return false;
  }
}

// Initial configuration
(async function initializeService() {
  try {
    // First try to configure Resend since it has better deliverability
    const resendConfigured = await checkAndConfigureResend();
    
    // Then try to configure SMTP as primary or backup
    const smtpConfigured = await checkAndConfigureSMTP();
    
    if (!resendConfigured && !smtpConfigured) {
      console.log('[Email Service] No email services available, using simulation');
    }
  } catch (error) {
    console.error('[Email Service] Unexpected error during initialization:', error);
  } finally {
    // Log current service status
    console.log(`[Email Service] Primary provider: ${emailServiceProvider}`);
    console.log(`[Email Service] Backup provider: ${backupEmailService ? 'smtp' : 'none'}`);
    console.log(`[Email Service] Service available: ${isEmailServiceAvailable ? 'Yes' : 'No'}`);
  }
})().catch(error => {
  console.error('[Email Service] Fatal initialization error:', error);
});

// Email service status and configuration
export const emailServiceStatus = {
  get isAvailable() { return isEmailServiceAvailable; },
  get provider() { return emailServiceProvider; },
  get backupProvider() { return backupEmailService ? 'smtp' : 'none'; },
  get isSmtpConfigured() { return isSmtpConfigured; },
  get isResendConfigured() { return isResendConfigured; },
  get resendTestResult() { return resendTestResult; },
  get smtpTestResult() { return smtpTestResult; },
  get error() { return emailServiceError; }
};

// Helper function to retry sending email with backup service if primary fails
async function sendWithRetry(
  sendFn: (service: EmailService) => Promise<boolean>,
  maxRetries: number = 2
): Promise<boolean> {
  // Try with primary service first
  try {
    const result = await sendFn(emailService);
    if (result) {
      return true;
    }
  } catch (error) {
    console.error('[Email Service] Error sending with primary service:', error);
  }
  
  // If primary failed and we have a backup, try with backup
  if (backupEmailService) {
    console.log('[Email Service] Primary service failed, trying backup service...');
    try {
      const result = await sendFn(backupEmailService);
      if (result) {
        console.log('[Email Service] Backup service succeeded!');
        return true;
      }
    } catch (error) {
      console.error('[Email Service] Error sending with backup service:', error);
    }
  }
  
  // If we've reached this point, both primary and backup failed
  // Just return false instead of throwing an error
  console.error('[Email Service] All email services failed');
  return false;
}

// Helper function to ensure at least one email service is ready
async function ensureEmailServiceReady(): Promise<boolean> {
  // If the service is already available, return true
  if (isEmailServiceAvailable) {
    return true;
  }
  
  // Try to initialize services again
  let serviceReady = false;
  
  if (isResendConfigured) {
    serviceReady = await checkAndConfigureResend();
  }
  
  if (!serviceReady && isSmtpConfigured) {
    serviceReady = await checkAndConfigureSMTP();
  }
  
  return serviceReady;
}

// Export all email sending functions with retry mechanism
export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  await ensureEmailServiceReady();
  return sendWithRetry((service) => service.sendWelcomeEmail(email, username));
}

export async function sendPaymentConfirmationEmail(
  email: string, 
  username: string, 
  planName: string, 
  amount: string, 
  endDate: string
): Promise<boolean> {
  await ensureEmailServiceReady();
  return sendWithRetry((service) => 
    service.sendPaymentConfirmationEmail(email, username, planName, amount, endDate)
  );
}

export async function sendTrialExpiringEmail(
  email: string, 
  username: string, 
  daysLeft: number
): Promise<boolean> {
  await ensureEmailServiceReady();
  return sendWithRetry((service) => 
    service.sendTrialExpiringEmail(email, username, daysLeft)
  );
}

export async function sendSubscriptionEndedEmail(
  email: string, 
  username: string
): Promise<boolean> {
  await ensureEmailServiceReady();
  return sendWithRetry((service) => 
    service.sendSubscriptionEndedEmail(email, username)
  );
}

export async function sendPasswordResetEmail(
  email: string, 
  username: string, 
  resetToken: string
): Promise<boolean> {
  await ensureEmailServiceReady();
  return sendWithRetry((service) => 
    service.sendPasswordResetEmail(email, username, resetToken)
  );
}