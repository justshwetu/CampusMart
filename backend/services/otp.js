const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Generate a 6-digit numeric OTP
function generateOtp() {
  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { code, expiresAt };
}

async function hashOtp(code) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(code, salt);
}

async function verifyOtpHash(code, hash) {
  return bcrypt.compare(code, hash || '');
}

function canSendAgain(lastSentAt, minIntervalMs = 60 * 1000) {
  if (!lastSentAt) return true;
  return Date.now() - new Date(lastSentAt).getTime() >= minIntervalMs;
}

function buildTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null; // Use console fallback
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

async function sendOtpEmail(to, code) {
  const from = process.env.OTP_FROM || 'no-reply@campusmart.local';
  const transport = buildTransport();

  const subject = 'Your Campus Mart verification code';
  const text = `Your verification code is ${code}. It expires in 10 minutes.`;
  const html = `<p>Your verification code is <b>${code}</b>.</p><p>It expires in 10 minutes.</p>`;

  if (!transport) {
    console.log(`OTP for ${to}: ${code} (SMTP not configured, logged for development)`);
    return { success: true, fallbackLogged: true };
  }

  await transport.sendMail({ from, to, subject, text, html });
  return { success: true };
}

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  canSendAgain,
  sendOtpEmail
};