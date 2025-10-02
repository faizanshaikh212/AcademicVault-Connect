/**
 * Email Service
 * Handles all email communications with professional templates
 */

import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailService {
  constructor() {
    // Debug email configuration
    console.log('Email Service Configuration:', {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      user: process.env.SMTP_USER ? '***@' + process.env.SMTP_USER.split('@')[1] : 'NOT_SET',
      pass: process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT_SET'
    });

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message);
      return false;
    }
  }

  /**
   * Send email verification email
   * @param {Object} user - User object
   * @param {string} token - Verification token
   */
  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.CLIENT_ORIGIN}/verify-email/${token}`;

    const html = this.getEmailTemplate('verification', {
      firstName: user.firstName,
      verificationUrl,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@academicvault.com'
    });

    const mailOptions = {
      from: `"Academic Vault" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Verify Your Email Address - Academic Vault',
      html,
    };

    try {
      console.log(`📧 Attempting to send verification email to ${user.email}`);
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent successfully to ${user.email}`, {
        messageId: result.messageId,
        response: result.response
      });
    } catch (error) {
      console.error('❌ Error sending verification email:', {
        error: error.message,
        code: error.code,
        command: error.command,
        to: user.email
      });
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  /**
   * Send password reset email
   * @param {Object} user - User object
   * @param {string} token - Reset token
   */
  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.CLIENT_ORIGIN}/reset-password/${token}`;

    const html = this.getEmailTemplate('passwordReset', {
      firstName: user.firstName,
      resetUrl,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@academicvault.com'
    });

    const mailOptions = {
      from: `"Academic Vault" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Reset Your Password - Academic Vault',
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Send password change notification
   * @param {Object} user - User object
   */
  async sendPasswordChangeNotification(user) {
    const html = this.getEmailTemplate('passwordChanged', {
      firstName: user.firstName,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@academicvault.com'
    });

    const mailOptions = {
      from: `"Academic Vault" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password Changed - Academic Vault',
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password change notification sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending password change notification:', error);
    }
  }

  /**
   * Send 2FA enabled notification
   * @param {Object} user - User object
   */
  async send2FAEnabledNotification(user) {
    const html = this.getEmailTemplate('2faEnabled', {
      firstName: user.firstName,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@academicvault.com'
    });

    const mailOptions = {
      from: `"Academic Vault" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Two-Factor Authentication Enabled - Academic Vault',
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`2FA enabled notification sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending 2FA notification:', error);
    }
  }

  /**
   * Send security alert
   * @param {Object} user - User object
   * @param {string} event - Security event description
   */
  async sendSecurityAlert(user, event) {
    const html = this.getEmailTemplate('securityAlert', {
      firstName: user.firstName,
      event,
      supportEmail: process.env.SUPPORT_EMAIL || 'support@academicvault.com'
    });

    const mailOptions = {
      from: `"Academic Vault" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Security Alert - Academic Vault',
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Security alert sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending security alert:', error);
    }
  }

  /**
   * Get email template
   * @param {string} templateName - Template name
   * @param {Object} data - Template data
   * @returns {string} - HTML template
   */
  getEmailTemplate(templateName, data) {
    const templates = {
      verification: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Academic Vault</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${data.firstName}!</h2>
              <p>Thank you for registering with Academic Vault. To complete your registration, please verify your email address by clicking the button below:</p>
              <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
              <p>This verification link will expire in 24 hours for security reasons.</p>
              <p>If you didn't create an account with Academic Vault, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>Need help? Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
              <p>&copy; 2024 Academic Vault. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      passwordReset: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Academic Vault</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello ${data.firstName},</p>
              <p>We received a request to reset your password for your Academic Vault account. Click the button below to reset your password:</p>
              <a href="${data.resetUrl}" class="button">Reset Password</a>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p><a href="${data.resetUrl}">${data.resetUrl}</a></p>
              <p>This password reset link will expire in 1 hour for security reasons.</p>
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>Need help? Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
              <p>&copy; 2024 Academic Vault. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      passwordChanged: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Academic Vault</h1>
            </div>
            <div class="content">
              <h2>Password Successfully Changed</h2>
              <p>Hello ${data.firstName},</p>
              <p>Your password has been successfully changed. If you made this change, no further action is required.</p>
              <p>If you did not change your password, please contact our support team immediately.</p>
              <p>For your security, all active sessions have been logged out.</p>
            </div>
            <div class="footer">
              <p>Need help? Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
              <p>&copy; 2024 Academic Vault. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      '2faEnabled': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>2FA Enabled</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Academic Vault</h1>
            </div>
            <div class="content">
              <h2>Two-Factor Authentication Enabled</h2>
              <p>Hello ${data.firstName},</p>
              <p>Two-factor authentication has been successfully enabled on your Academic Vault account.</p>
              <p>Your account is now more secure. You'll need to provide a verification code from your authenticator app when logging in.</p>
              <p>If you did not enable 2FA, please contact our support team immediately.</p>
            </div>
            <div class="footer">
              <p>Need help? Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
              <p>&copy; 2024 Academic Vault. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      securityAlert: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Alert</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ffc107; color: #212529; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Academic Vault</h1>
            </div>
            <div class="content">
              <h2>Security Alert</h2>
              <p>Hello ${data.firstName},</p>
              <p>We detected the following security event on your account:</p>
              <p><strong>${data.event}</strong></p>
              <p>If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately by changing your password.</p>
            </div>
            <div class="footer">
              <p>Need help? Contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></p>
              <p>&copy; 2024 Academic Vault. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return templates[templateName] || '';
  }
}

export default new EmailService();