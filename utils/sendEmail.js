const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  return transporter;
}

/**
 * @param {{to: string, subject: string, html: string}} options
 */
async function sendEmail({ to, subject, html }) {
  const fromName = process.env.EMAIL_FROM_NAME || 'ShopEasy';

  await getTransporter().sendMail({
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
