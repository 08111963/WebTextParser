import nodemailer from 'nodemailer';

// Verifica la presenza delle variabili d'ambiente necessarie
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
  console.warn('SMTP environment variables not set properly. Email functionality will be limited.');
}

// Configurazione del transporter SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465, // true per porta 465, false per altre porte
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  // Aggiungi debug per individuare eventuali problemi
  logger: true,
  debug: true, // include SMTP traffic in the logs
  // Imposta le opzioni TLS
  tls: {
    // Non fallire su certificati invalidi
    rejectUnauthorized: false
  }
});

// Interfaccia per i parametri dell'email
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Invia un'email utilizzando la configurazione SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER) {
      console.warn(`SMTP_USER not set, email to ${options.to} not sent.`);
      return false;
    }

    const mailOptions = {
      from: `"NutriEasy App" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Invia un'email di benvenuto
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

  return await sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Invia un'email di conferma di pagamento
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  username: string,
  planName: string,
  amount: string,
  endDate: string
): Promise<boolean> {
  const subject = 'Payment Confirmation - NutriEasy Premium';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Payment Confirmed!</h2>
      <p>Hello ${username},</p>
      <p>Thank you for subscribing to NutriEasy Premium. Your payment has been successfully processed.</p>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold;">Subscription Details:</p>
        <p style="margin: 10px 0 0;">Plan: ${planName}</p>
        <p style="margin: 5px 0 0;">Amount: ${amount}</p>
        <p style="margin: 5px 0 0;">Valid until: ${endDate}</p>
      </div>
      <p>You now have full access to all premium features of NutriEasy.</p>
      <p>If you have any questions about your subscription or need assistance, please contact our support team.</p>
      <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 4px;">
        <p style="margin: 0;">Thank you for choosing NutriEasy!</p>
        <p style="margin: 5px 0 0; font-weight: bold;">The NutriEasy Team</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Invia un'email di avviso scadenza trial
 */
export async function sendTrialExpiringEmail(
  email: string,
  username: string,
  daysLeft: number
): Promise<boolean> {
  const subject = 'Your NutriEasy Trial Is Ending Soon';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Your Trial is Ending Soon</h2>
      <p>Hello ${username},</p>
      <p>This is a friendly reminder that your NutriEasy free trial will expire in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.</p>
      <p>To continue enjoying all premium features without interruption, we recommend upgrading to a premium plan before your trial ends.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Upgrade Now</a>
      </div>
      <p>With NutriEasy Premium, you'll continue to have access to:</p>
      <ul>
        <li>Advanced nutritional analytics</li>
        <li>Personalized meal recommendations</li>
        <li>Progress tracking and reporting</li>
        <li>Unlimited meal plans</li>
      </ul>
      <p>If you have any questions about our premium plans, please don't hesitate to contact our support team.</p>
      <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 4px;">
        <p style="margin: 0;">Thank you for trying NutriEasy!</p>
        <p style="margin: 5px 0 0; font-weight: bold;">The NutriEasy Team</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Invia un'email di notifica scadenza abbonamento
 */
export async function sendSubscriptionEndedEmail(
  email: string,
  username: string
): Promise<boolean> {
  const subject = 'Your NutriEasy Trial Has Ended';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Your Trial Has Ended</h2>
      <p>Hello ${username},</p>
      <p>Your NutriEasy free trial period has ended. Your data will be retained for 7 more days, giving you time to upgrade to a premium plan.</p>
      <p>Don't miss out on the benefits you've been enjoying during your trial:</p>
      <ul>
        <li>Comprehensive nutrition tracking</li>
        <li>Personalized meal suggestions</li>
        <li>Goal setting and progress monitoring</li>
        <li>Detailed nutritional analysis</li>
      </ul>
      <div style="margin: 20px 0; text-align: center;">
        <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Upgrade to Premium</a>
      </div>
      <p>If you choose not to upgrade, you'll still be able to access basic features, but premium functionality will be limited.</p>
      <p>If you have any questions or need assistance, our support team is always here to help.</p>
      <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 4px;">
        <p style="margin: 0;">Thank you for trying NutriEasy!</p>
        <p style="margin: 5px 0 0; font-weight: bold;">The NutriEasy Team</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html
  });
}

/**
 * Invia un'email di recupero password
 */
export async function sendPasswordResetEmail(
  email: string,
  username: string,
  resetToken: string
): Promise<boolean> {
  const subject = 'Password Reset - NutriEasy';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5;">Password Reset Request</h2>
      <p>Hello ${username},</p>
      <p>We received a request to reset your password for your NutriEasy account. If you didn't make this request, you can safely ignore this email.</p>
      <p>To reset your password, use the following token:</p>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; font-family: monospace; font-size: 18px; font-weight: bold;">${resetToken}</p>
      </div>
      <p>This token will expire in 1 hour for security reasons.</p>
      <p>If you have any questions or need assistance, please contact our support team.</p>
      <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 4px;">
        <p style="margin: 0;">Thank you for using NutriEasy!</p>
        <p style="margin: 5px 0 0; font-weight: bold;">The NutriEasy Team</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html
  });
}

// Test iniziale di connessione
export async function testSMTPConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('SMTP server connection established successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return false;
  }
}

// Verifica la connessione all'avvio
testSMTPConnection()
  .then(isConnected => {
    if (!isConnected) {
      console.warn('SMTP service initialization failed. Email sending will be limited.');
    }
  })
  .catch(error => {
    console.error('Error during SMTP testing:', error);
  });