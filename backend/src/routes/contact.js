import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

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
      'INSERT INTO contact_messages (id, user_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?, ?)',
      [messageId, userId, name, email, subject, message]
    );

    res.status(201).json({ message: 'Your message has been received. Our team will get back to you shortly!' });
  } catch (err) {
    console.error('Error submitting contact message:', err);
    res.status(500).json({ error: 'Server error submitting message. Please try again later.' });
  }
});

export default router;
