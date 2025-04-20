/**
 * Email Service - Central manager for sending emails
 * 
 * Supports Resend API and development fallback
 */
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

// Check if Resend API key is configured
const isResendConfigured = !!process.env.RESEND_API_KEY;

// Configure Resend API service
async function configureResendService(): Promise<boolean> {
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

// Initial configuration
(async function initializeService() {
  try {
    // Try to configure Resend
    const resendConfigured = await configureResendService();
    
    if (!resendConfigured) {
      console.log('[Email Service] No email service available, using simulation');
    }
  } catch (error) {
    console.error('[Email Service] Unexpected error during initialization:', error);
  } finally {
    // Log current service status
    console.log(`[Email Service] Provider: ${emailServiceProvider}`);
    console.log(`[Email Service] Service available: ${isEmailServiceAvailable ? 'Yes' : 'No'}`);
  }
})().catch(error => {
  console.error('[Email Service] Fatal initialization error:', error);
});

// Email service status and configuration
export const emailServiceStatus = {
  get isAvailable() { return isEmailServiceAvailable; },
  get provider() { return emailServiceProvider; },
  get isResendConfigured() { return isResendConfigured; },
  get resendTestResult() { return resendTestResult; },
  get error() { return emailServiceError; }
};

// Helper function to ensure email service is ready
async function ensureEmailServiceReady(): Promise<boolean> {
  // If the service is already available, return true
  if (isEmailServiceAvailable) {
    return true;
  }
  
  // Try to initialize again
  return await configureResendService();
}

// Export all email sending functions
export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  await ensureEmailServiceReady();
  
  try {
    console.log(`[Email Service] Sending welcome email to ${email} using ${emailServiceProvider}...`);
    const result = await emailService.sendWelcomeEmail(email, username);
    if (result) {
      console.log(`[Email Service] Welcome email sent successfully to ${email}`);
    } else {
      console.log(`[Email Service] Failed to send welcome email to ${email}`);
    }
    return result;
  } catch (error) {
    console.error(`[Email Service] Error sending welcome email to ${email}:`, error);
    return false;
  }
}

export async function sendPaymentConfirmationEmail(
  email: string, 
  username: string, 
  planName: string, 
  amount: string, 
  endDate: string
): Promise<boolean> {
  await ensureEmailServiceReady();
  
  try {
    console.log(`[Email Service] Sending payment confirmation email to ${email} using ${emailServiceProvider}...`);
    const result = await emailService.sendPaymentConfirmationEmail(email, username, planName, amount, endDate);
    if (result) {
      console.log(`[Email Service] Payment confirmation email sent successfully to ${email}`);
    } else {
      console.log(`[Email Service] Failed to send payment confirmation email to ${email}`);
    }
    return result;
  } catch (error) {
    console.error(`[Email Service] Error sending payment confirmation email to ${email}:`, error);
    return false;
  }
}

export async function sendTrialExpiringEmail(
  email: string, 
  username: string, 
  daysLeft: number
): Promise<boolean> {
  await ensureEmailServiceReady();
  
  try {
    console.log(`[Email Service] Sending trial expiring email to ${email} using ${emailServiceProvider}...`);
    const result = await emailService.sendTrialExpiringEmail(email, username, daysLeft);
    if (result) {
      console.log(`[Email Service] Trial expiring email sent successfully to ${email}`);
    } else {
      console.log(`[Email Service] Failed to send trial expiring email to ${email}`);
    }
    return result;
  } catch (error) {
    console.error(`[Email Service] Error sending trial expiring email to ${email}:`, error);
    return false;
  }
}

export async function sendSubscriptionEndedEmail(
  email: string, 
  username: string
): Promise<boolean> {
  await ensureEmailServiceReady();
  
  try {
    console.log(`[Email Service] Sending subscription ended email to ${email} using ${emailServiceProvider}...`);
    const result = await emailService.sendSubscriptionEndedEmail(email, username);
    if (result) {
      console.log(`[Email Service] Subscription ended email sent successfully to ${email}`);
    } else {
      console.log(`[Email Service] Failed to send subscription ended email to ${email}`);
    }
    return result;
  } catch (error) {
    console.error(`[Email Service] Error sending subscription ended email to ${email}:`, error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string, 
  username: string, 
  resetToken: string
): Promise<boolean> {
  await ensureEmailServiceReady();
  
  try {
    console.log(`[Email Service] Sending password reset email to ${email} using ${emailServiceProvider}...`);
    const result = await emailService.sendPasswordResetEmail(email, username, resetToken);
    if (result) {
      console.log(`[Email Service] Password reset email sent successfully to ${email}`);
    } else {
      console.log(`[Email Service] Failed to send password reset email to ${email}`);
    }
    return result;
  } catch (error) {
    console.error(`[Email Service] Error sending password reset email to ${email}:`, error);
    return false;
  }
}