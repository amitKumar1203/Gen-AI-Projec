const nodemailer = require('nodemailer');

// Base URL for links in emails (Cloudflare tunnel URL when sharing publicly)
const getEmailBaseUrl = () => process.env.CLOUDFLARE_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send welcome email on registration
const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"AmitAI" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Welcome to AmitAI! 🚀',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { width: 80px; height: 80px; background: linear-gradient(135deg, #8b5cf6, #ec4899); border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
            .content { background: rgba(255,255,255,0.05); border-radius: 16px; padding: 30px; border: 1px solid rgba(255,255,255,0.1); }
            h1 { color: #ffffff; margin: 0 0 10px; font-size: 28px; }
            .highlight { color: #a855f7; }
            p { color: #9ca3af; line-height: 1.6; margin: 15px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 14px 30px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .features { margin: 25px 0; }
            .feature { display: flex; align-items: center; margin: 12px 0; color: #d1d5db; }
            .feature-icon { width: 24px; height: 24px; margin-right: 12px; color: #a855f7; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h1>Welcome to <span class="highlight">AmitAI</span>!</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${user.name}</strong>,</p>
              <p>Thank you for joining AmitAI! We're excited to have you on board.</p>
              
              <div class="features">
                <p><strong>What you can do:</strong></p>
                <div class="feature">✨ Chat with multiple AI models (Llama, GPT-4, Mixtral)</div>
                <div class="feature">📄 Analyze your resume with AI feedback</div>
                <div class="feature">🔒 Secure authentication & data protection</div>
              </div>
              
              <center>
                <a href="${getEmailBaseUrl()}/dashboard" class="button">
                  Start Chatting →
                </a>
              </center>
              
              <p>If you have any questions, feel free to reach out!</p>
              <p>Best regards,<br><strong>The AmitAI Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 AmitAI. Built by Amit with ❤️</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter();
    const resetUrl = `${getEmailBaseUrl()}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"AmitAI" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Reset Your Password - AmitAI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { background: rgba(255,255,255,0.05); border-radius: 16px; padding: 30px; border: 1px solid rgba(255,255,255,0.1); }
            h1 { color: #ffffff; margin: 0 0 10px; font-size: 24px; }
            p { color: #9ca3af; line-height: 1.6; margin: 15px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 14px 30px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .warning { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 15px; margin: 20px 0; color: #fca5a5; font-size: 14px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .code { background: rgba(139, 92, 246, 0.2); padding: 10px 15px; border-radius: 8px; font-family: monospace; color: #a855f7; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${user.name}</strong>,</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <center>
                <a href="${resetUrl}" class="button">
                  Reset Password →
                </a>
              </center>
              
              <p>Or copy and paste this link in your browser:</p>
              <div class="code">${resetUrl}</div>
              
              <div class="warning">
                ⚠️ This link will expire in <strong>1 hour</strong>. If you didn't request this, please ignore this email.
              </div>
              
              <p>Best regards,<br><strong>The AmitAI Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 AmitAI. Built by Amit with ❤️</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send reset email:', error.message);
    return false;
  }
};

// Send password changed confirmation
const sendPasswordChangedEmail = async (user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"AmitAI" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password Changed Successfully - AmitAI',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .content { background: rgba(255,255,255,0.05); border-radius: 16px; padding: 30px; border: 1px solid rgba(255,255,255,0.1); }
            h1 { color: #ffffff; margin: 0 0 10px; font-size: 24px; }
            p { color: #9ca3af; line-height: 1.6; margin: 15px 0; }
            .success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 15px; margin: 20px 0; color: #86efac; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <h1>✅ Password Changed</h1>
              <p>Hi <strong>${user.name}</strong>,</p>
              
              <div class="success">
                Your password has been successfully changed. You can now log in with your new password.
              </div>
              
              <p>If you didn't make this change, please contact us immediately.</p>
              
              <p>Best regards,<br><strong>The AmitAI Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 AmitAI. Built by Amit with ❤️</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password changed email sent to:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send password changed email:', error.message);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail
};
