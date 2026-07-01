import express from 'express';
import pool from '../config/db.js';
import redisClient from '../config/redis.js';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/force-init', async (req, res) => {
  const addColumn = async (query) => {
    try {
      await pool.query(query);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }
  };

  try {
    await addColumn("ALTER TABLE events ADD COLUMN currency VARCHAR(10) DEFAULT '₹'");
    await addColumn("ALTER TABLE events ADD COLUMN host_id VARCHAR(36)");
    await addColumn("ALTER TABLE events ADD COLUMN deposit_amount DECIMAL(10, 2) DEFAULT 0");
    await addColumn("ALTER TABLE events ADD COLUMN deposit_status VARCHAR(20) DEFAULT 'none'");
    res.json({ message: 'All migrations applied!' });
  } catch (err) {
    res.json({ error: err.message, code: err.code });
  }
});

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

// Get events hosted by the current user
router.get('/hosted', authenticateToken, async (req, res) => {
  const hostId = req.user.id;
  try {
    const [result] = await pool.query('SELECT * FROM events WHERE host_id = ? ORDER BY date DESC', [hostId]);
    res.json(result);
  } catch (err) {
    console.error('Error fetching hosted events:', err);
    res.status(500).json({ error: 'Server error fetching hosted events.' });
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
router.post('/', authenticateToken, async (req, res) => {
  const { title, description, date, duration_hours, venue, total_seats, ticket_price, category, currency, deposit_amount, image_url } = req.body;
  const host_id = req.user.id;

  if (!title || !date || !venue || !total_seats || !ticket_price || !deposit_amount) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (new Date(date) < new Date()) {
    return res.status(400).json({ error: 'Event date and time cannot be in the past.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const eventId = crypto.randomUUID();
    
    // Map event categories to beautiful, high-quality Unsplash placeholders
    const categoryPlaceholders = {
      'Music': [
        'https://images.unsplash.com/photo-1540039155732-61ee0175b9f4?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop&q=60',
      ],
      'Technology': [
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=800&auto=format&fit=crop&q=60',
      ],
      'Arts & Culture': [
        'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=60',
      ],
      'Festivals': [
        'https://images.unsplash.com/photo-1533174000255-14f76cc3830c?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60',
      ],
      'Entertainment': [
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=800&auto=format&fit=crop&q=60',
      ],
      'Sports': [
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=60',
      ],
      'Workshops': [
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
      ],
      'Charity': [
        'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=60',
      ],
      'Default': [
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=60'
      ]
    };

    let img = image_url;
    if (!img || img.trim() === '') {
      const selectedCategory = category || 'Default';
      const imagesList = categoryPlaceholders[selectedCategory] || categoryPlaceholders['Default'];
      img = imagesList[Math.floor(Math.random() * imagesList.length)];
    }

    await connection.query(
      'INSERT INTO events (id, title, description, date, duration_hours, venue, total_seats, ticket_price, image_url, category, currency, host_id, deposit_amount, deposit_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [eventId, title, description, date, duration_hours || 2, venue, total_seats, ticket_price, img, category || 'Uncategorized', currency || '₹', host_id, parseFloat(deposit_amount), 'held']
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


// Process refund and commission for a hosted event
router.post('/:id/refund', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const hostId = req.user.id;
  
  try {
    const [events] = await pool.query('SELECT * FROM events WHERE id = ? AND host_id = ?', [id, hostId]);
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found or unauthorized.' });
    }
    
    const event = events[0];
    if (event.deposit_status === 'refunded') {
      return res.status(400).json({ error: 'Deposit has already been refunded.' });
    }
    
    // Simulate refund logic
    const depositAmount = parseFloat(event.deposit_amount);
    const commission = depositAmount * 0.10; // 10% commission
    const refundAmount = depositAmount - commission;
    
    await pool.query('UPDATE events SET deposit_status = "refunded" WHERE id = ?', [id]);
    
    res.json({ 
      message: 'Deposit refunded successfully.',
      originalDeposit: depositAmount,
      commissionCut: commission,
      refundedAmount: refundAmount
    });
  } catch (err) {
    console.error('Error processing refund:', err);
    res.status(500).json({ error: 'Server error processing refund.' });
  }
});

// Delete an event by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.query('DELETE FROM seats WHERE event_id = ?', [id]);
    await connection.query('DELETE FROM events WHERE id = ?', [id]);
    await connection.commit();
    connection.release();
    res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Server error deleting event.' });
  }
});

export default router;
