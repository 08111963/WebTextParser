/**
 * Mailtrap Service - Service for sending emails using Mailtrap
 */
import * as nodemailer from 'nodemailer';

// Check if all required Mailtrap environment variables are set
const isMailtrapConfigured = 
  !!process.env.MAILTRAP_HOST && 
  !!process.env.MAILTRAP_PORT && 
  !!process.env.MAILTRAP_USERNAME && 
  !!process.env.MAILTRAP_PASSWORD;

// Initialize transporter
let transporter: nodemailer.Transporter | null = null;

if (isMailtrapConfigured) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: Number(process.env.MAILTRAP_PORT),
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });
    console.log('[Mailtrap Service] Mailtrap transport configured successfully!');
  } catch (error) {
    console.error('[Mailtrap Service] Error configuring Mailtrap transport:', error);
  }
}

/**
 * Test the Mailtrap connection
 */
export async function testMailtrapConnection(): Promise<boolean> {
  if (!transporter) {
    console.error('[Mailtrap Service] Mailtrap transport not configured');
    return false;
  }

  try {
    // Verify connection configuration
    await transporter.verify();
    console.log('[Mailtrap Service] Mailtrap connection verified');
    return true;
  } catch (error) {
    console.error('[Mailtrap Service] Mailtrap connection test failed:', error);
    return false;
  }
}

/**
 * Send a welcome email
 */
export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  if (!transporter) {
    console.error('[Mailtrap Service] Mailtrap transport not configured');
    return false;
  }

  try {
    const mailOptions = {
      from: '"NutriEasy" <nutrieasy@example.com>',
      to: email,
      subject: 'Welcome to NutriEasy!',
      html: `
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
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailtrap Service] Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Mailtrap Service] Error sending welcome email:', error);
    return false;
  }
}

/**
 * Send a payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  email: string, 
  username: string, 
  planName: string, 
  amount: string, 
  endDate: string
): Promise<boolean> {
  if (!transporter) {
    console.error('[Mailtrap Service] Mailtrap transport not configured');
    return false;
  }

  try {
    const mailOptions = {
      from: '"NutriEasy" <nutrieasy@example.com>',
      to: email,
      subject: 'Payment Confirmation - NutriEasy',
      html: `
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
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailtrap Service] Payment confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Mailtrap Service] Error sending payment confirmation email:', error);
    return false;
  }
}

/**
 * Send a trial expiring email
 */
export async function sendTrialExpiringEmail(
  email: string, 
  username: string, 
  daysLeft: number
): Promise<boolean> {
  if (!transporter) {
    console.error('[Mailtrap Service] Mailtrap transport not configured');
    return false;
  }

  try {
    const mailOptions = {
      from: '"NutriEasy" <nutrieasy@example.com>',
      to: email,
      subject: `Your NutriEasy Trial Ends in ${daysLeft} Days`,
      html: `
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
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailtrap Service] Trial expiring email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Mailtrap Service] Error sending trial expiring email:', error);
    return false;
  }
}

/**
 * Send a subscription ended email
 */
export async function sendSubscriptionEndedEmail(
  email: string, 
  username: string
): Promise<boolean> {
  if (!transporter) {
    console.error('[Mailtrap Service] Mailtrap transport not configured');
    return false;
  }

  try {
    const mailOptions = {
      from: '"NutriEasy" <nutrieasy@example.com>',
      to: email,
      subject: 'Your NutriEasy Subscription Has Ended',
      html: `
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
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailtrap Service] Subscription ended email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Mailtrap Service] Error sending subscription ended email:', error);
    return false;
  }
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string, 
  username: string, 
  resetToken: string
): Promise<boolean> {
  if (!transporter) {
    console.error('[Mailtrap Service] Mailtrap transport not configured');
    return false;
  }

  try {
    const resetLink = `https://nutrieasy.app/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: '"NutriEasy" <nutrieasy@example.com>',
      to: email,
      subject: 'Reset Your NutriEasy Password',
      html: `
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
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Mailtrap Service] Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Mailtrap Service] Error sending password reset email:', error);
    return false;
  }
}