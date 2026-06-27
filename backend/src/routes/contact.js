import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendContactAutoResponseEmail } from '../utils/email.js';
import Groq from 'groq-sdk';

const router = express.Router();

// Middleware to optionally authenticate token if authorization header is present
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    return authenticateToken(req, res, next);
  }
  next();
};

// POST a new contact message
router.post('/', optionalAuth, async (req, res) => {
  const { name, email, subject, message } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields (name, email, subject, message) are required.' });
  }

  try {
    const messageId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO contact_messages (id, user_id, name, email, subject, message, is_replied) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [messageId, userId, name, email, subject, message, true]
    );

    // Try to send an instant AI response, but don't crash if it fails
    try {
      if (process.env.GROQ_API_KEY) {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const prompt = `You are a helpful customer support assistant for NovaTix, an event ticketing platform.
A customer named ${name} has submitted the following message via the contact form:
Subject: ${subject}
Message: ${message}

Please draft a polite, professional, and helpful response to this customer. Address them by their name. Do not include subject lines or "Dear Customer", just start with the body of the response formatted in HTML (use <p>, <ul>, etc. where appropriate). Keep it concise and relevant.`;

        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama3-8b-8192',
        });

        const aiResponseHtml = chatCompletion.choices[0]?.message?.content || "<p>Thank you for reaching out to us. We have received your message and our team is looking into it.</p>";

        await sendContactAutoResponseEmail(email, name, subject, aiResponseHtml);
        console.log(`Instant AI reply sent to ${email}`);
      }
    } catch (aiError) {
      console.error('Failed to send instant AI response:', aiError);
      // We still want to return a 201 success even if the AI fails
      await pool.query('UPDATE contact_messages SET is_replied = FALSE WHERE id = ?', [messageId]);
    }

    res.status(201).json({ message: 'Your message has been received. Our team will get back to you shortly!' });
  } catch (err) {
    console.error('Error submitting contact message:', err);
    res.status(500).json({ error: 'Server error submitting message. Please try again later.' });
  }
});

export default router;
