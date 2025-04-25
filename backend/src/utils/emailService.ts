import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from './logger';
import { format } from 'date-fns';

// Load environment variables
dotenv.config();

// Configure email transport
const createTransporter = () => {
  // In production, use your SMTP provider
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // In development, use test account or ethereal email
    logger.info('Using development email transport');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.DEV_EMAIL_USER || 'development@test.com',
        pass: process.env.DEV_EMAIL_PASSWORD || 'password123',
      },
    });
  }
};

// Get a cached transporter instance
let transporter: nodemailer.Transporter;
const getTransporter = async () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

// Base email template
const generateEmailTemplate = (
  title: string,
  content: string,
  buttonText?: string,
  buttonUrl?: string
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: a;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .logo {
          text-align: center;
          margin-bottom: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .content {
          padding: 15px;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          background-color: #4F46E5;
          color: #ffffff;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          margin-top: 15px;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #888;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <h1>SportNexus</h1>
        </div>
        <div class="header">
          <h2>${title}</h2>
        </div>
        <div class="content">
          ${content}
          ${
            buttonText && buttonUrl
              ? `<div style="text-align: center;">
                   <a href="${buttonUrl}" class="button">${buttonText}</a>
                 </div>`
              : ''
          }
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} SportNexus. All rights reserved.
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send email helper function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    const emailTransporter = await getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SportNexus <notifications@sportnexus.com>',
      to,
      subject,
      html,
    };
    
    logger.debug('Sending email', { to, subject });
    const info = await emailTransporter.sendMail(mailOptions);
    
    // Log email sent info but redact sensitive information
    logger.info('Email sent successfully', { 
      messageId: info.messageId,
      recipient: to.includes('@') ? to.split('@')[0] + '@...' : to
    });
    
    // In development, log preview URL
    if (process.env.NODE_ENV !== 'production' && info.messageId) {
      logger.info(`Email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error sending email', { error: errorMessage, to, subject });
    return false;
  }
};

// Email notifications for bookings
export const sendBookingConfirmationEmail = async (
  userEmail: string,
  userName: string,
  bookingDetails: {
    bookingId: string;
    itemType: string;
    itemName: string;
    date: Date;
    timeSlot?: { start: string; end: string };
    totalPrice: number;
  }
) => {
  const { bookingId, itemType, itemName, date, timeSlot, totalPrice } = bookingDetails;
  
  // Format date
  const formattedDate = format(new Date(date), 'MMMM do, yyyy');
  
  // Format time slot if available
  const timeSlotText = timeSlot 
    ? `Time: ${timeSlot.start} - ${timeSlot.end}` 
    : '';
  
  const subject = `Your SportNexus Booking Confirmation (#${bookingId.slice(-6)})`;
  
  const content = `
    <p>Hello ${userName},</p>
    
    <p>Thank you for your booking with SportNexus. Your reservation has been confirmed.</p>
    
    <h3>Booking Details:</h3>
    <p>
      <strong>Booking ID:</strong> ${bookingId}<br>
      <strong>Item:</strong> ${itemName} (${itemType})<br>
      <strong>Date:</strong> ${formattedDate}<br>
      ${timeSlotText ? `<strong>${timeSlotText}</strong><br>` : ''}
      <strong>Total Amount:</strong> $${totalPrice.toFixed(2)}
    </p>
    
    <p>You can view and manage your booking in your account dashboard.</p>
  `;
  
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings/${bookingId}`;
  
  const emailHtml = generateEmailTemplate(
    'Booking Confirmation',
    content,
    'View Booking',
    dashboardUrl
  );
  
  return await sendEmail(userEmail, subject, emailHtml);
};

export const sendBookingStatusUpdateEmail = async (
  userEmail: string,
  userName: string,
  bookingDetails: {
    bookingId: string;
    itemType: string;
    itemName: string;
    date: Date;
    timeSlot?: { start: string; end: string };
    status: string;
    reason?: string;
  }
) => {
  const { bookingId, itemType, itemName, date, timeSlot, status, reason } = bookingDetails;
  
  // Format date
  const formattedDate = format(new Date(date), 'MMMM do, yyyy');
  
  // Format time slot if available
  const timeSlotText = timeSlot 
    ? `Time: ${timeSlot.start} - ${timeSlot.end}` 
    : '';
  
  // Map status to human-readable message
  let statusMessage = '';
  let statusTitle = '';
  
  switch (status) {
    case 'confirmed':
      statusTitle = 'Booking Confirmed';
      statusMessage = 'Your booking has been confirmed.';
      break;
    case 'canceled':
      statusTitle = 'Booking Canceled';
      statusMessage = 'Your booking has been canceled.';
      break;
    case 'completed':
      statusTitle = 'Booking Completed';
      statusMessage = 'Thank you for using our service. Your booking has been marked as completed.';
      break;
    default:
      statusTitle = 'Booking Update';
      statusMessage = `Your booking status has been updated to: ${status}.`;
  }
  
  const subject = `SportNexus Booking ${statusTitle} (#${bookingId.slice(-6)})`;
  
  const content = `
    <p>Hello ${userName},</p>
    
    <p>${statusMessage}</p>
    
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    
    <h3>Booking Details:</h3>
    <p>
      <strong>Booking ID:</strong> ${bookingId}<br>
      <strong>Item:</strong> ${itemName} (${itemType})<br>
      <strong>Date:</strong> ${formattedDate}<br>
      ${timeSlotText ? `<strong>${timeSlotText}</strong><br>` : ''}
    </p>
    
    <p>You can view your booking details in your account dashboard.</p>
  `;
  
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings/${bookingId}`;
  
  const emailHtml = generateEmailTemplate(
    statusTitle,
    content,
    'View Booking',
    dashboardUrl
  );
  
  return await sendEmail(userEmail, subject, emailHtml);
};

export const sendBookingReminderEmail = async (
  userEmail: string,
  userName: string,
  bookingDetails: {
    bookingId: string;
    itemType: string;
    itemName: string;
    date: Date;
    timeSlot?: { start: string; end: string };
  }
) => {
  const { bookingId, itemType, itemName, date, timeSlot } = bookingDetails;
  
  // Format date
  const formattedDate = format(new Date(date), 'MMMM do, yyyy');
  
  // Format time slot if available
  const timeSlotText = timeSlot 
    ? `Time: ${timeSlot.start} - ${timeSlot.end}` 
    : '';
  
  const subject = `Reminder: Your SportNexus Booking Tomorrow (#${bookingId.slice(-6)})`;
  
  const content = `
    <p>Hello ${userName},</p>
    
    <p>This is a friendly reminder that you have a booking with SportNexus tomorrow.</p>
    
    <h3>Booking Details:</h3>
    <p>
      <strong>Booking ID:</strong> ${bookingId}<br>
      <strong>Item:</strong> ${itemName} (${itemType})<br>
      <strong>Date:</strong> ${formattedDate}<br>
      ${timeSlotText ? `<strong>${timeSlotText}</strong><br>` : ''}
    </p>
    
    <p>We look forward to serving you!</p>
  `;
  
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings/${bookingId}`;
  
  const emailHtml = generateEmailTemplate(
    'Booking Reminder',
    content,
    'View Booking',
    dashboardUrl
  );
  
  return await sendEmail(userEmail, subject, emailHtml);
};

export const sendPasswordResetEmail = async (
  userEmail: string,
  userName: string,
  resetToken: string
) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/reset-password/${resetToken}`;
  
  const subject = 'SportNexus - Password Reset';
  
  const content = `
    <p>Hello ${userName},</p>
    
    <p>We received a request to reset your password for your SportNexus account.</p>
    
    <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
    
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  `;
  
  const emailHtml = generateEmailTemplate(
    'Reset Your Password',
    content,
    'Reset Password',
    resetUrl
  );
  
  return await sendEmail(userEmail, subject, emailHtml);
};

export default {
  sendEmail,
  sendBookingConfirmationEmail,
  sendBookingStatusUpdateEmail,
  sendBookingReminderEmail,
  sendPasswordResetEmail
}; 