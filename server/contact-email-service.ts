/**
 * Contact Email Service
 * 
 * This service handles sending emails when a user fills out the contact form.
 * It uses the Brevo API with a fetch implementation.
 */

import { InsertEmailResponse } from './email-response';

// Constant for the Brevo API URL
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Check if the API key is available
if (!process.env.BREVO_API_KEY) {
  console.error('BREVO_API_KEY is not defined in environment variables');
}

// Configure senders and recipients
const adminEmail = "support@nutrieasy.eu";
const adminName = "Support NutriEasy";

// Utility function to send emails via Brevo
async function sendEmail(to: string | string[], subject: string, htmlContent: string, textContent: string, replyTo?: {email: string, name: string}): Promise<boolean> {
  try {
    // Check if the API key is available
    if (!process.env.BREVO_API_KEY) {
      console.warn('BREVO_API_KEY not available, unable to send email');
      return false;
    }

    // Prepare the recipient in the correct format
    const toArray = Array.isArray(to) 
      ? to.map(email => ({ email }))
      : [{ email: to }];

    // Configure the data for sending
    const payload = {
      sender: { email: adminEmail, name: adminName },
      to: toArray,
      subject,
      htmlContent,
      textContent,
      replyTo: replyTo || { email: adminEmail, name: adminName }
    };

    // Send the request to the Brevo API
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API Error:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('Email sent successfully via Brevo:', data);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Function to send a notification email to the administrator when a message comes from the contact form
export async function sendContactNotificationEmail(contactMessage: InsertEmailResponse): Promise<boolean> {
  try {
    const { email, subject, message } = contactMessage;

    // Configure email content
    const emailSubject = `[Website Contact] ${subject}`;
    
    // HTML email content
    const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New message from website</h1>
        </div>
        <div style="padding: 20px;">
          <p><strong>From:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 15px 0;">
            <p style="white-space: pre-line;">${message}</p>
          </div>
          <p style="margin-top: 20px;">To reply directly to this message, use the "Reply" button in your email client.</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 10px; font-size: 12px; text-align: center; color: #777;">
          <p>NutriEasy - Contact Notification System</p>
        </div>
      </body>
    </html>
    `;

    // Plain text email content (for clients that don't support HTML)
    const textContent = `
    New message from website
    ---------------------------
    
    From: ${email}
    Subject: ${subject}
    
    Message:
    ${message}
    
    ---------------------------
    To reply directly to this message, use the "Reply" button in your email client.
    `;

    // Use sender's email as replyTo
    const replyTo = { 
      email: email, 
      name: email.split('@')[0] 
    };

    return await sendEmail(adminEmail, emailSubject, htmlContent, textContent, replyTo);
  } catch (error) {
    console.error('Error sending contact notification email:', error);
    return false;
  }
}

// Function to send a confirmation receipt to the user
export async function sendContactConfirmationEmail(email: string, subject: string): Promise<boolean> {
  try {
    // Configure email content
    const emailSubject = `Receipt Confirmation: ${subject}`;
    
    // HTML email content
    const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">We've received your message</h1>
        </div>
        <div style="padding: 20px;">
          <p>Thank you for contacting us.</p>
          <p>This is an automatic message to confirm that we have received your request with subject: <strong>${subject}</strong>.</p>
          <p>We will respond as soon as possible.</p>
          <p>Best regards,<br>The NutriEasy Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 10px; font-size: 12px; text-align: center; color: #777;">
          <p>You are receiving this email because you used the contact form on our website. If you did not send any message, please ignore this email.</p>
          <p>&copy; 2025 NutriEasy. All rights reserved.</p>
        </div>
      </body>
    </html>
    `;

    // Plain text email content (for clients that don't support HTML)
    const textContent = `
    We've received your message
    
    Thank you for contacting us.
    
    This is an automatic message to confirm that we have received your request with subject: ${subject}.
    
    We will respond as soon as possible.
    
    Best regards,
    The NutriEasy Team
    
    ---
    You are receiving this email because you used the contact form on our website.
    If you did not send any message, please ignore this email.
    © 2025 NutriEasy. All rights reserved.
    `;

    return await sendEmail(email, emailSubject, htmlContent, textContent);
  } catch (error) {
    console.error('Error sending contact confirmation email:', error);
    return false;
  }
}