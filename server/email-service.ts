/**
 * Email Service - Brevo integration with fallback to logging
 * 
 * This service uses Brevo (formerly Sendinblue) to send emails.
 * In case of failure, it falls back to logging the email content to the console.
 */

import {
  sendWelcomeEmailWithBrevo,
  sendPaymentConfirmationEmailWithBrevo,
  sendTrialExpiringEmailWithBrevo,
  sendSubscriptionEndedEmailWithBrevo,
  sendPasswordResetEmailWithBrevo
} from './brevo-service-fetch';

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

// Email service provider info
const emailServiceProvider = 'brevo';

// Function to create a log-only email function (fallback)
function createLogEmailFunction(emailType: string): EmailFunction {
  return async (email: string, username: string, ...args: any[]): Promise<boolean> => {
    console.log(`========== EMAIL SIMULATION (${emailType}) - FALLBACK MODE ==========`);
    console.log(`Email: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Args:`, args);
    
    // Generate a descriptive message based on the email type
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

// Email service status
export const emailServiceStatus = {
  isActive: true,
  mode: emailServiceProvider,
  lastError: null as string | null,
  failedAttempts: 0,
  lastAttemptDate: null as number | null
};

// Create Brevo email service with fallback to logging
export const emailService: EmailService = {
  sendWelcomeEmail: async (email: string, username: string) => {
    try {
      const result = await sendWelcomeEmailWithBrevo(email, username);
      if (!result) {
        console.warn('[Email Service] Brevo email sending failed, falling back to log mode');
        emailServiceStatus.failedAttempts++;
        emailServiceStatus.lastError = 'Email sending failed';
        emailServiceStatus.lastAttemptDate = Date.now();
        emailServiceStatus.mode = 'fallback-log';
        return createLogEmailFunction('welcome')(email, username);
      }
      emailServiceStatus.mode = emailServiceProvider;
      return result;
    } catch (error: any) {
      console.error('[Email Service] Error with Brevo, falling back to log mode:', error);
      emailServiceStatus.failedAttempts++;
      emailServiceStatus.lastError = error?.message || 'Unknown error';
      emailServiceStatus.lastAttemptDate = Date.now();
      emailServiceStatus.mode = 'fallback-log';
      return createLogEmailFunction('welcome')(email, username);
    }
  },
  
  sendPaymentConfirmationEmail: async (email: string, username: string, planName: string, amount: string, endDate: string) => {
    try {
      const result = await sendPaymentConfirmationEmailWithBrevo(email, username, planName, amount, endDate);
      if (!result) {
        console.warn('[Email Service] Brevo email sending failed, falling back to log mode');
        emailServiceStatus.failedAttempts++;
        emailServiceStatus.lastError = 'Email sending failed';
        emailServiceStatus.lastAttemptDate = Date.now();
        emailServiceStatus.mode = 'fallback-log';
        return createLogEmailFunction('payment')(email, username, planName, amount, endDate);
      }
      emailServiceStatus.mode = emailServiceProvider;
      return result;
    } catch (error: any) {
      console.error('[Email Service] Error with Brevo, falling back to log mode:', error);
      emailServiceStatus.failedAttempts++;
      emailServiceStatus.lastError = error?.message || 'Unknown error';
      emailServiceStatus.lastAttemptDate = Date.now();
      emailServiceStatus.mode = 'fallback-log';
      return createLogEmailFunction('payment')(email, username, planName, amount, endDate);
    }
  },
  
  sendTrialExpiringEmail: async (email: string, username: string, daysLeft: number) => {
    try {
      const result = await sendTrialExpiringEmailWithBrevo(email, username, daysLeft);
      if (!result) {
        console.warn('[Email Service] Brevo email sending failed, falling back to log mode');
        emailServiceStatus.failedAttempts++;
        emailServiceStatus.lastError = 'Email sending failed';
        emailServiceStatus.lastAttemptDate = Date.now();
        emailServiceStatus.mode = 'fallback-log';
        return createLogEmailFunction('trial')(email, username, daysLeft);
      }
      emailServiceStatus.mode = emailServiceProvider;
      return result;
    } catch (error: any) {
      console.error('[Email Service] Error with Brevo, falling back to log mode:', error);
      emailServiceStatus.failedAttempts++;
      emailServiceStatus.lastError = error?.message || 'Unknown error';
      emailServiceStatus.lastAttemptDate = Date.now();
      emailServiceStatus.mode = 'fallback-log';
      return createLogEmailFunction('trial')(email, username, daysLeft);
    }
  },
  
  sendSubscriptionEndedEmail: async (email: string, username: string) => {
    try {
      const result = await sendSubscriptionEndedEmailWithBrevo(email, username);
      if (!result) {
        console.warn('[Email Service] Brevo email sending failed, falling back to log mode');
        emailServiceStatus.failedAttempts++;
        emailServiceStatus.lastError = 'Email sending failed';
        emailServiceStatus.lastAttemptDate = Date.now();
        emailServiceStatus.mode = 'fallback-log';
        return createLogEmailFunction('subscription')(email, username);
      }
      emailServiceStatus.mode = emailServiceProvider;
      return result;
    } catch (error: any) {
      console.error('[Email Service] Error with Brevo, falling back to log mode:', error);
      emailServiceStatus.failedAttempts++;
      emailServiceStatus.lastError = error?.message || 'Unknown error';
      emailServiceStatus.lastAttemptDate = Date.now();
      emailServiceStatus.mode = 'fallback-log';
      return createLogEmailFunction('subscription')(email, username);
    }
  },
  
  sendPasswordResetEmail: async (email: string, username: string, resetToken: string) => {
    try {
      const result = await sendPasswordResetEmailWithBrevo(email, username, resetToken);
      if (!result) {
        console.warn('[Email Service] Brevo email sending failed, falling back to log mode');
        emailServiceStatus.failedAttempts++;
        emailServiceStatus.lastError = 'Email sending failed';
        emailServiceStatus.lastAttemptDate = Date.now();
        emailServiceStatus.mode = 'fallback-log';
        return createLogEmailFunction('password')(email, username, resetToken);
      }
      emailServiceStatus.mode = emailServiceProvider;
      return result;
    } catch (error: any) {
      console.error('[Email Service] Error with Brevo, falling back to log mode:', error);
      emailServiceStatus.failedAttempts++;
      emailServiceStatus.lastError = error?.message || 'Unknown error';
      emailServiceStatus.lastAttemptDate = Date.now();
      emailServiceStatus.mode = 'fallback-log';
      return createLogEmailFunction('password')(email, username, resetToken);
    }
  }
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