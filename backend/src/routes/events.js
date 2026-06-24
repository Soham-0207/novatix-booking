import express from 'express';
import pool from '../config/db.js';
import redisClient from '../config/redis.js';

const router = express.Router();

// Get all events with available seat counts
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        e.*,
        COUNT(CASE WHEN s.status = 'available' THEN 1 END) as available_seats
      FROM events e
      LEFT JOIN seats s ON e.id = s.event_id
      GROUP BY e.id
      ORDER BY e.date ASC
    `;
    const [result] = await pool.query(query);
    res.json(result);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Server error fetching events.' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (result.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    res.json(result[0]);
  } catch (err) {
    console.error('Error fetching event details:', err);
    res.status(500).json({ error: 'Server error fetching event details.' });
  }
});

// Get seats layout for an event, incorporating Redis temporary locks
router.get('/:id/seats', async (req, res) => {
  const { id: eventId } = req.params;

  try {
    // 1. Fetch all seats for the event from DB
    const [seats] = await pool.query(
      'SELECT id, seat_number, status FROM seats WHERE event_id = ? ORDER BY seat_number',
      [eventId]
    );

    if (seats.length === 0) {
      return res.status(404).json({ error: 'No seats found for this event.' });
    }

    // 2. Fetch locks from Redis in one multi-get command
    const redisKeys = seats.map((seat) => `lock:seat:${eventId}:${seat.id}`);
    
    let locks = [];
    if (redisKeys.length > 0) {
      locks = await redisClient.mGet(redisKeys);
    }

    // 3. Merge DB state and Redis lock state
    const processedSeats = seats.map((seat, idx) => {
      const lockHolder = locks[idx]; // userId of reservation holder, or null
      let currentStatus = seat.status;

      if (seat.status === 'available' && lockHolder) {
        currentStatus = 'reserved';
      }

      return {
        id: seat.id,
        seat_number: seat.seat_number,
        status: currentStatus,
        reserved_by: lockHolder || null,
      };
    });

    res.json(processedSeats);
  } catch (err) {
    console.error('Error fetching seat layout:', err);
    res.status(500).json({ error: 'Server error fetching seat layout.' });
  }
});

export default router;
