/**
 * Email Service - Central manager for sending emails
 * 
 * Supports SendGrid for email and fallback for development.
 */
import * as sendgridService from './sendgrid-service';

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
let sendgridTestResult = false;

// Function to create a mock email function that logs email details
function createMockEmailFunction(emailType: string): EmailFunction {
  return async (email: string, username: string, ...args: any[]): Promise<boolean> => {
    console.log(`========== EMAIL SIMULATION (${emailType}) ==========`);
    console.log(`Email: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Args:`, args);
    
    // For debugging: show what would be in the email content
    let emailContent = '';
    
    switch (emailType) {
      case 'welcome':
        emailContent = `Welcome to NutriEasy, ${username}! Your 5-day free trial has started.`;
        break;
      case 'payment':
        emailContent = `Payment confirmation for ${args[0]} plan. Amount: ${args[1]}, Valid until: ${args[2]}`;
        break;
      case 'trial':
        emailContent = `Your NutriEasy trial will expire in ${args[0]} days.`;
        break;
      case 'subscription':
        emailContent = 'Your NutriEasy subscription has ended.';
        break;
      case 'password':
        emailContent = 'Password reset link (token redacted for security).';
        break;
    }
    
    console.log(`Email content: ${emailContent}`);
    console.log('================================================');
    return true;
  };
}

// Mock email service with simulation functions
const mockEmailService: EmailService = {
  sendWelcomeEmail: createMockEmailFunction('welcome'),
  sendPaymentConfirmationEmail: createMockEmailFunction('payment'),
  sendTrialExpiringEmail: createMockEmailFunction('trial'),
  sendSubscriptionEndedEmail: createMockEmailFunction('subscription'),
  sendPasswordResetEmail: createMockEmailFunction('password'),
};

// Variable that will contain the email service (or fallback)
let emailService: EmailService = mockEmailService;

// Check if SendGrid is configured
const isSendGridConfigured = !!process.env.BREVO_API_KEY;

// Configure SendGrid service
async function configureSendGridService(): Promise<boolean> {
  if (!isSendGridConfigured) {
    console.log('[Email Service] SendGrid not configured');
    return false;
  }
  
  try {
    console.log('[Email Service] Testing SendGrid connection...');
    const testResult = await sendgridService.testSendGridConnection();
    sendgridTestResult = testResult;
    
    if (testResult) {
      emailService = sendgridService;
      isEmailServiceAvailable = true;
      emailServiceProvider = 'sendgrid';
      console.log('[Email Service] SendGrid service configured successfully!');
      return true;
    } else {
      throw new Error('SendGrid connection test failed');
    }
  } catch (error) {
    emailServiceError = error instanceof Error ? error : new Error(String(error));
    console.error('[Email Service] Error configuring SendGrid service:', error);
    return false;
  }
}

// Initial configuration
(async function initializeService() {
  try {
    // Try to configure SendGrid
    const sendgridConfigured = await configureSendGridService();
    
    if (!sendgridConfigured) {
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
  get isSendGridConfigured() { return isSendGridConfigured; },
  get sendgridTestResult() { return sendgridTestResult; },
  get error() { return emailServiceError; }
};

// Export all email sending functions
export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
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