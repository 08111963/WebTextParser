/**
 * Email Service - Central manager for sending emails
 * 
 * Supports Resend API, SMTP service and development fallback
 */
import fs from 'fs';
import path from 'path';
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

// Initialize email service with async function to avoid top-level await
async function initializeEmailService() {
  // Priority: Resend API first, then SMTP, then fallback
  if (isResendConfigured) {
    // Use Resend API as main service
    try {
      console.log('[Email Service] Using Resend API as primary email service...');
      
      // Verify that the Resend module contains the necessary functions
      if (
        typeof resendService.sendWelcomeEmail === 'function' &&
        typeof resendService.sendPaymentConfirmationEmail === 'function' &&
        typeof resendService.sendTrialExpiringEmail === 'function' &&
        typeof resendService.sendSubscriptionEndedEmail === 'function' &&
        typeof resendService.sendPasswordResetEmail === 'function'
      ) {
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
      } else {
        throw new Error('The Resend module does not contain all required functions');
      }
    } catch (error: any) {
      emailServiceError = error;
      console.error('[Email Service] Error configuring Resend:', error);
      console.log('[Email Service] Attempting to use SMTP as fallback...');
      
      // If Resend fails, try SMTP
      if (isSmtpConfigured) {
        try {
          console.log('[Email Service] SMTP configuration found, using SMTP service as fallback...');
          
          // Verify that the SMTP module contains the necessary functions
          if (
            typeof smtpService.sendWelcomeEmail === 'function' &&
            typeof smtpService.sendPaymentConfirmationEmail === 'function' &&
            typeof smtpService.sendTrialExpiringEmail === 'function' &&
            typeof smtpService.sendSubscriptionEndedEmail === 'function' &&
            typeof smtpService.sendPasswordResetEmail === 'function'
          ) {
            // Assign the SMTP module to the email service
            emailService = smtpService;
            isEmailServiceAvailable = true;
            emailServiceProvider = 'smtp';
            console.log('[Email Service] SMTP service configured as fallback!');
          } else {
            throw new Error('The SMTP module does not contain all required functions');
          }
        } catch (error: any) {
          emailServiceError = error;
          console.error('[Email Service] SMTP fallback also failed:', error);
          console.log('[Email Service] Using email simulation service');
        }
      }
    }
  } else if (isSmtpConfigured) {
  // If Resend is not configured but SMTP is, use SMTP directly
  try {
    console.log('[Email Service] Resend not available, using SMTP service...');
    
    // Verify that the SMTP module contains the necessary functions
    if (
      typeof smtpService.sendWelcomeEmail === 'function' &&
      typeof smtpService.sendPaymentConfirmationEmail === 'function' &&
      typeof smtpService.sendTrialExpiringEmail === 'function' &&
      typeof smtpService.sendSubscriptionEndedEmail === 'function' &&
      typeof smtpService.sendPasswordResetEmail === 'function'
    ) {
      // Assign the SMTP module to the email service
      emailService = smtpService;
      isEmailServiceAvailable = true;
      emailServiceProvider = 'smtp';
      console.log('[Email Service] SMTP service configured successfully!');
    } else {
      throw new Error('The SMTP module does not contain all required functions');
    }
  } catch (error: any) {
    emailServiceError = error;
    console.error('[Email Service] Error configuring SMTP service:', error);
    console.log('[Email Service] Using email simulation service');
  }
} else {
  console.log('[Email Service] No email configuration found, using email simulation service');
}

  // Current service status
  console.log(`[Email Service] Configured provider: ${emailServiceProvider}`);
  console.log(`[Email Service] Service available: ${isEmailServiceAvailable ? 'Yes' : 'No'}`);
  
  // Return the current status for later use
  return {
    isAvailable: isEmailServiceAvailable,
    provider: emailServiceProvider
  };
}

// Call the initialization function immediately
initializeEmailService().catch(error => {
  console.error('[Email Service] Initialization failed:', error);
});

// Export email service status and functions
export const emailServiceStatus = {
  get isAvailable() { return isEmailServiceAvailable; },
  get provider() { return emailServiceProvider; },
  get isSmtpConfigured() { return isSmtpConfigured; },
  get isResendConfigured() { return isResendConfigured; },
  get error() { return emailServiceError; }
};

// Export email service functions
export const {
  sendWelcomeEmail,
  sendPaymentConfirmationEmail,
  sendTrialExpiringEmail,
  sendSubscriptionEndedEmail,
  sendPasswordResetEmail
} = emailService;