import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

// Initialize transporter if SMTP credentials are provided
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  console.warn(
    'WARNING: SMTP_USER and SMTP_PASS are not defined in backend/.env. Email notifications will be LOGGED TO CONSOLE instead of sent.'
  );
}

/**
 * Sends an email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML formatted content
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const fromEmail = process.env.SMTP_FROM || 'noreply@civicpulse.gov.in';
  
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"CivicPulse AI India" <${fromEmail}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`[Email Service] Sent email to ${to} successfully.`);
    } catch (error) {
      console.error(`[Email Service] Error sending email to ${to}:`, error);
    }
  } else {
    // Development fallback / Console Logger
    console.log('\n==================================================');
    console.log(`[MOCK EMAIL SENT TO]: ${to}`);
    console.log(`[FROM]: "CivicPulse AI India" <${fromEmail}>`);
    console.log(`[SUBJECT]: ${subject}`);
    console.log('--------------------------------------------------');
    console.log(`[BODY (TEXT)]:\n${text}`);
    if (html) {
      console.log('--------------------------------------------------');
      console.log(`[BODY (HTML)]:\n${html}`);
    }
    console.log('==================================================\n');
  }
};
