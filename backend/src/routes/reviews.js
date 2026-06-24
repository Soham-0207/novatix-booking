import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET all reviews for an event
router.get('/:eventId', async (req, res) => {
  const { eventId } = req.params;
  try {
    const [reviews] = await pool.query(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ?
      ORDER BY r.created_at DESC
    `, [eventId]);
    
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Server error fetching reviews.' });
  }
});

// POST a new review (requires authentication)
router.post('/', authenticateToken, async (req, res) => {
  const { eventId, rating, comment } = req.body;
  const userId = req.user.id;

  if (!eventId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Valid event ID and a rating between 1 and 5 are required.' });
  }

  try {
    // Check if event exists
    const [events] = await pool.query('SELECT id FROM events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Optional: Check if user already reviewed this event (prevent spam)
    const [existing] = await pool.query('SELECT id FROM reviews WHERE user_id = ? AND event_id = ?', [userId, eventId]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this event.' });
    }

    const reviewId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO reviews (id, user_id, event_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [reviewId, userId, eventId, rating, comment || null]
    );

    res.status(201).json({ message: 'Review submitted successfully', reviewId });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Server error submitting review.' });
  }
});

export default router;
