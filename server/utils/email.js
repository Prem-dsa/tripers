const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
  port: process.env.EMAIL_PORT || process.env.SMTP_PORT,
  secure: (process.env.EMAIL_PORT || process.env.SMTP_PORT) == 465,
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Tripers <noreply@tripers.app>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Email send error:', error.message);
    // Don't throw — email failures shouldn't break API calls
  }
};

const emailTemplates = {
  verifyEmail: (name, verifyUrl) => ({
    subject: 'Verify your Tripers account',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#1E293B;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
        <div style="background:linear-gradient(135deg,#6C63FF,#8B5CF6);padding:40px;text-align:center;">
          <h1 style="margin:0;font-size:28px;color:white;font-weight:800;">✈️ Tripers</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Travel Together. Split Smarter.</p>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#6C63FF;margin-top:0;">Welcome, ${name}! 🎉</h2>
          <p style="color:#475569;line-height:1.6;">Please verify your email address to get started with Tripers.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#6C63FF,#8B5CF6);color:white;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;margin:20px 0;font-family:Inter,sans-serif;">Verify Email</a>
          <p style="color:#94A3B8;font-size:13px;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
        </div>
        <div style="background:#F8FAFC;padding:20px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="color:#94A3B8;font-size:12px;margin:0;">© 2026 Tripers Inc. All rights reserved.</p>
        </div>
      </div>`,
  }),

  resetPassword: (name, resetUrl) => ({
    subject: 'Reset your Tripers password',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#1E293B;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
        <div style="background:linear-gradient(135deg,#6C63FF,#8B5CF6);padding:40px;text-align:center;">
          <h1 style="margin:0;font-size:28px;color:white;font-weight:800;">✈️ Tripers</h1>
        </div>
        <div style="padding:40px;">
          <h2 style="margin-top:0;color:#1E293B;">Hi ${name}, reset your password 🔐</h2>
          <p style="color:#475569;line-height:1.6;">Click below to set a new password. This link expires in 10 minutes.</p>
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;margin:20px 0;">Reset Password</a>
          <p style="color:#94A3B8;font-size:13px;">If you didn't request this, please ignore this email.</p>
        </div>
        <div style="background:#F8FAFC;padding:20px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="color:#94A3B8;font-size:12px;margin:0;">© 2026 Tripers Inc. All rights reserved.</p>
        </div>
      </div>`,
  }),

  tripInvite: (inviterName, tripName, inviteUrl) => ({
    subject: `${inviterName} invited you to join ${tripName} on Tripers`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#1E293B;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
        <div style="background:linear-gradient(135deg,#6C63FF,#8B5CF6);padding:40px;text-align:center;">
          <h1 style="margin:0;font-size:28px;color:white;font-weight:800;">✈️ Tripers</h1>
        </div>
        <div style="padding:40px;">
          <h2 style="margin-top:0;color:#1E293B;">${inviterName} invited you! 🗺️</h2>
          <p style="color:#475569;line-height:1.6;">Join <strong>${tripName}</strong> on Tripers to track expenses together and split smarter.</p>
          <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#6C63FF,#8B5CF6);color:white;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;margin:20px 0;">Join Trip</a>
        </div>
        <div style="background:#F8FAFC;padding:20px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="color:#94A3B8;font-size:12px;margin:0;">© 2026 Tripers Inc. All rights reserved.</p>
        </div>
      </div>`,
  }),
};

module.exports = { sendEmail, emailTemplates };
