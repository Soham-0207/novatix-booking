import express from 'express';
import pool from '../config/db.js';
import redisClient from '../config/redis.js';
import crypto from 'crypto';

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

// Create a new event and automatically generate its seats
router.post('/', async (req, res) => {
  const { title, description, date, duration_hours, venue, total_seats, ticket_price, category } = req.body;

  if (!title || !date || !venue || !total_seats || !ticket_price) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const eventId = crypto.randomUUID();
    
    // Choose a random high-quality placeholder image for user-created events
    const placeholders = [
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1533174000255-14f76cc3830c?w=800&auto=format&fit=crop&q=60'
    ];
    const img = placeholders[Math.floor(Math.random() * placeholders.length)];

    await connection.query(
      'INSERT INTO events (id, title, description, date, duration_hours, venue, total_seats, ticket_price, image_url, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [eventId, title, description, date, duration_hours || 2, venue, total_seats, ticket_price, img, category || 'Uncategorized']
    );

    // Seed seats for event (Rows A-Z, 1-10 columns)
    const rowsNeeded = Math.ceil(total_seats / 10);
    let seatValues = [];
    for (let r = 1; r <= rowsNeeded; r++) {
      const rowChar = String.fromCharCode(64 + r); // A, B, C...
      for (let s = 1; s <= 10; s++) {
        if (((r - 1) * 10 + s) <= total_seats) {
          seatValues.push([crypto.randomUUID(), eventId, `${rowChar}${s}`, 'available']);
        }
      }
    }

    if (seatValues.length > 0) {
      await connection.query('INSERT INTO seats (id, event_id, seat_number, status) VALUES ?', [seatValues]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Event created successfully!', eventId });
  } catch (err) {
    await connection.rollback();
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Server error creating event.' });
  } finally {
    connection.release();
  }
});

export default router;
