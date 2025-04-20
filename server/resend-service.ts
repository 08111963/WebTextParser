/**
 * Resend Email Service - Service for sending emails using Resend API
 */
import { Resend } from 'resend';

// Create Resend instance
const resend = new Resend(process.env.RESEND_API_KEY);

// Define email options interface
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Sends an email using Resend API
 * 
 * Note: In testing mode, Resend only allows sending to:
 * 1. The email verified with your account
 * 2. The special testing email (delivered@resend.dev)
 * 
 * For production use, you must verify a domain and use an email address
 * from that domain in the "from" field.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Resend requires a verified domain or using onboarding@resend.dev for testing
    const { data, error } = await resend.emails.send({
      from: 'NutriEasy <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html || '',
      text: options.text
    });

    if (error) {
      console.error('Error sending email with Resend:', error);
      
      // Check if the error is due to unverified domain restrictions
      if (error.statusCode === 403 && error.message?.includes('can only send testing emails')) {
        console.log('Resend is in testing mode. To send to any email address, verify a domain at resend.com/domains');
      }
      
      return false;
    }

    console.log('Email sent successfully with Resend. ID:', data?.id);
    return true;
  } catch (error) {
    console.error('Exception when sending email with Resend:', error);
    return false;
  }
}

/**
 * Sends a welcome email
 */
export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  const subject = 'Welcome to NutriEasy!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Welcome to NutriEasy, ${username}!</h2>
      <p>Thank you for joining our community. We're excited to help you on your nutrition journey.</p>
      <p>With NutriEasy, you can:</p>
      <ul>
        <li>Track your daily meals and nutritional intake</li>
        <li>Set and monitor your nutrition goals</li>
        <li>Get personalized meal suggestions</li>
        <li>Monitor your progress over time</li>
      </ul>
      <p>You now have a 5-day free trial with full access to all premium features.</p>
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 4px;">
        <p style="margin: 0;">Happy healthy eating!</p>
        <p style="margin: 5px 0 0; font-weight: bold;">The NutriEasy Team</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  username: string,
  planName: string,
  amount: string,
  endDate: string
): Promise<boolean> {
  const subject = 'Payment Confirmation - NutriEasy';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Payment Confirmation</h2>
      <p>Hello ${username},</p>
      <p>Thank you for subscribing to NutriEasy. Your payment has been successfully processed.</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 4px;">
        <h3 style="margin-top: 0;">Payment Details:</h3>
        <p><strong>Plan:</strong> ${planName}</p>
        <p><strong>Amount:</strong> ${amount}</p>
        <p><strong>Valid until:</strong> ${endDate}</p>
      </div>
      
      <p>You now have full access to all premium features of NutriEasy. Enjoy creating personalized meal plans, tracking your nutrition goals, and more!</p>
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      <p>Thank you for choosing NutriEasy!</p>
      <p style="font-weight: bold;">The NutriEasy Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a trial expiring email
 */
export async function sendTrialExpiringEmail(
  email: string,
  username: string,
  daysLeft: number
): Promise<boolean> {
  const subject = `Your NutriEasy Trial Ends in ${daysLeft} Days`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Your Trial is Ending Soon</h2>
      <p>Hello ${username},</p>
      <p>This is a friendly reminder that your NutriEasy free trial will end in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 4px;">
        <p style="font-weight: bold; margin-top: 0;">Don't lose access to these premium features:</p>
        <ul>
          <li>AI-powered personalized meal suggestions</li>
          <li>Advanced nutrition tracking and analytics</li>
          <li>Custom meal plan creation</li>
          <li>Progress reporting and insights</li>
        </ul>
      </div>
      
      <p>Upgrade now to continue enjoying all the benefits of NutriEasy without interruption.</p>
      <a href="https://nutrieasy.app/pricing" style="display: inline-block; margin: 15px 0; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Upgrade Now</a>
      
      <p>If you have any questions or need assistance, our support team is here to help.</p>
      <p>Thank you for trying NutriEasy!</p>
      <p style="font-weight: bold;">The NutriEasy Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a subscription ended email
 */
export async function sendSubscriptionEndedEmail(
  email: string,
  username: string
): Promise<boolean> {
  const subject = 'Your NutriEasy Subscription Has Ended';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Your Subscription Has Ended</h2>
      <p>Hello ${username},</p>
      <p>We're sorry to inform you that your NutriEasy subscription has ended.</p>
      <p>Your account has been switched to the basic version with limited features. You still have access to your data, but premium features are no longer available.</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 4px;">
        <p style="font-weight: bold; margin-top: 0;">Reactivate your subscription to regain access to:</p>
        <ul>
          <li>AI-powered personalized meal suggestions</li>
          <li>Advanced nutrition tracking and analytics</li>
          <li>Custom meal plan creation</li>
          <li>Progress reporting and insights</li>
        </ul>
      </div>
      
      <p>We'd love to have you back! Click the button below to reactivate your subscription.</p>
      <a href="https://nutrieasy.app/pricing" style="display: inline-block; margin: 15px 0; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Renew Subscription</a>
      
      <p>If you have any questions or feedback, please don't hesitate to contact our support team.</p>
      <p>Thank you for being a NutriEasy customer!</p>
      <p style="font-weight: bold;">The NutriEasy Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetToken: string
): Promise<boolean> {
  const subject = 'Reset Your NutriEasy Password';
  const resetLink = `https://nutrieasy.app/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Reset Your Password</h2>
      <p>Hello ${username},</p>
      <p>We received a request to reset your NutriEasy password. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, click the button below:</p>
      
      <a href="${resetLink}" style="display: inline-block; margin: 20px 0; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      
      <p>This link will expire in 24 hours for security reasons.</p>
      <p>If the button above doesn't work, copy and paste the following URL into your browser:</p>
      <p style="word-break: break-all; background-color: #f9fafb; padding: 10px; border-radius: 4px;">${resetLink}</p>
      
      <p>If you didn't request a password reset, please contact our support team immediately.</p>
      <p style="font-weight: bold;">The NutriEasy Team</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Tests the Resend connection
 * Note: Resend requires using their special test email address for testing
 */
export async function testResendConnection(): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'NutriEasy <onboarding@resend.dev>',
      to: 'delivered@resend.dev', // Special address for testing
      subject: 'Test Connection - NutriEasy',
      html: '<p>This is a test email to verify Resend service connectivity.</p>'
    });

    if (error) {
      console.error('Error testing Resend connection:', error);
      return false;
    }

    console.log('Resend connection test successful. ID:', data?.id);
    return true;
  } catch (error) {
    console.error('Exception when testing Resend connection:', error);
    return false;
  }
}