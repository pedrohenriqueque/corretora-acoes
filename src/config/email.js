const nodemailer = require('nodemailer');
require('dotenv').config();

let emailTransporter;

// Verifica se as credenciais de e-mail estão presentes no arquivo .env
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true', // true para porta 465, false para outras portas (como 587)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  // Fallback seguro de desenvolvimento e testes caso as credenciais não estejam no .env
  emailTransporter = {
    sendMail: async (options) => {
      console.log('--- ENVIANDO E-MAIL (MOCK/DESENVOLVIMENTO) ---');
      console.log(`De: ${options.from || 'no-reply@sistema.com'}`);
      console.log(`Para: ${options.to}`);
      console.log(`Assunto: ${options.subject}`);
      console.log(`Corpo: ${options.html}`);
      console.log('----------------------------------------------');
      return { messageId: 'mock-email-id-' + Date.now() };
    }
  };
}

module.exports = emailTransporter;
