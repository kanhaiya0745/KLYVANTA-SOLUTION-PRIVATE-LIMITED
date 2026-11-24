require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');
const DATA_DIR = path.join(__dirname, 'data');
const ENQUIRIES_FILE = path.join(DATA_DIR, 'enquiries.jsonl');

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));
app.use(express.json({ limit: '20kb' }));

// Allow the VS Code Live Server preview during local development.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isLocalLiveServer = /^http:\/\/(localhost|127\.0\.0\.1):55\d{2}$/.test(origin || '');
  const isLocalBackend = origin === `http://localhost:${PORT}` || origin === `http://127.0.0.1:${PORT}`;
  if (origin && (isLocalLiveServer || isLocalBackend)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const enquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many enquiries from this connection. Please try again later.' }
});

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'KLYVANTA enquiry API' });
});

app.post('/api/enquiries', enquiryLimiter, async (req, res, next) => {
  try {
    const enquiry = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      name: cleanText(req.body.name, 100),
      phone: cleanText(req.body.phone, 20),
      email: cleanText(req.body.email, 150),
      service: cleanText(req.body.service, 100),
      message: cleanText(req.body.message, 3000),
      status: 'new'
    };

    const phoneDigits = enquiry.phone.replace(/\D/g, '');
    if (!enquiry.name || phoneDigits.length < 10 || !enquiry.service || !enquiry.message) {
      return res.status(400).json({
        message: 'Please provide your name, a valid phone number, service and project details.'
      });
    }

    if (enquiry.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.appendFile(ENQUIRIES_FILE, `${JSON.stringify(enquiry)}\n`, 'utf8');

    // Optional SMTP notification. The enquiry is still saved if SMTP is not configured.
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        await transporter.sendMail({
          from: process.env.MAIL_FROM || process.env.SMTP_USER,
          to: process.env.ENQUIRY_TO || 'klyvantasolutionpvtltd@gmail.com',
          subject: `New website enquiry: ${enquiry.service}`,
          text: [
            `Name: ${enquiry.name}`,
            `Phone: ${enquiry.phone}`,
            `Email: ${enquiry.email || 'Not provided'}`,
            `Service: ${enquiry.service}`,
            `Project details: ${enquiry.message}`,
            `Received: ${enquiry.createdAt}`
          ].join('\n')
        });
      } catch (mailError) {
        console.error('Enquiry email notification failed:', mailError.message);
      }
    }

    return res.status(201).json({
      message: 'Your enquiry has been recorded successfully.',
      enquiryId: enquiry.id
    });
  } catch (error) {
    return next(error);
  }
});

app.use(express.static(FRONTEND_DIR));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong while saving your enquiry.' });
});

app.listen(PORT, () => {
  console.log(`KLYVANTA website is running at http://localhost:${PORT}`);
  console.log(`Enquiry API: http://localhost:${PORT}/api/enquiries`);
});
