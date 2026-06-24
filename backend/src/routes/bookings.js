import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import redisClient from '../config/redis.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. Temporary Seat Reservation (Redis Lock)
router.post('/reserve', authenticateToken, async (req, res) => {
  const { eventId, seatIds } = req.body;
  const userId = req.user.id;

  if (!eventId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: 'Please provide eventId and an array of seatIds.' });
  }

  try {
    // A. Check MySQL to ensure seats aren't already booked
    const placeholders = seatIds.map(() => '?').join(',');
    const [seatsCheck] = await pool.query(
      `SELECT id, seat_number, status FROM seats WHERE id IN (${placeholders}) AND event_id = ?`,
      [...seatIds, eventId]
    );

    if (seatsCheck.length !== seatIds.length) {
      return res.status(400).json({ error: 'Some requested seats do not exist for this event.' });
    }

    const alreadyBooked = seatsCheck.filter(s => s.status === 'booked');
    if (alreadyBooked.length > 0) {
      const seatNums = alreadyBooked.map(s => s.seat_number).join(', ');
      return res.status(409).json({ error: `Seats [${seatNums}] are already permanently booked.` });
    }

    // B. Acquire locks in Redis (with rollback if any fail)
    const lockedKeys = [];
    const TTL_SECONDS = 300; // 5 minutes hold

    for (const seatId of seatIds) {
      const lockKey = `lock:seat:${eventId}:${seatId}`;
      
      const acquired = await redisClient.set(lockKey, userId, {
        NX: true,
        EX: TTL_SECONDS,
      });

      if (!acquired) {
        for (const key of lockedKeys) {
          await redisClient.del(key);
        }
        return res.status(409).json({
          error: `One or more seats are currently held by another user. Please choose different seats.`,
        });
      }
      lockedKeys.push(lockKey);
    }

    res.json({
      message: 'Seats temporarily reserved.',
      expiresIn: TTL_SECONDS,
      seatIds,
    });
  } catch (err) {
    console.error('Reservation error:', err);
    res.status(500).json({ error: 'Server error during reservation.' });
  }
});

// 2. Release Temporary Reservation (Cancel hold)
router.post('/release', authenticateToken, async (req, res) => {
  const { eventId, seatIds } = req.body;
  const userId = req.user.id;

  if (!eventId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: 'Please provide eventId and seatIds.' });
  }

  try {
    for (const seatId of seatIds) {
      const lockKey = `lock:seat:${eventId}:${seatId}`;
      const holder = await redisClient.get(lockKey);
      if (holder === userId) {
        await redisClient.del(lockKey);
      }
    }
    res.json({ message: 'Reservations released successfully.' });
  } catch (err) {
    console.error('Release reservation error:', err);
    res.status(500).json({ error: 'Server error releasing reservations.' });
  }
});

// 3. Final Bookings & Purchase (MySQL Transaction with row-locking)
router.post('/book', authenticateToken, async (req, res) => {
  const { eventId, seatIds } = req.body;
  const userId = req.user.id;

  if (!eventId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: 'Please provide eventId and seatIds.' });
  }

  // Get a client from the pool to handle the transaction exclusively
  const dbClient = await pool.getConnection();

  try {
    // Start MySQL Transaction
    await dbClient.beginTransaction();

    // A. Query seats with FOR UPDATE to lock the rows
    const placeholders = seatIds.map(() => '?').join(',');
    const [dbSeats] = await dbClient.query(
      `SELECT id, seat_number, status FROM seats WHERE event_id = ? AND id IN (${placeholders}) FOR UPDATE`,
      [eventId, ...seatIds]
    );

    if (dbSeats.length !== seatIds.length) {
      throw new Error('Some seats were not found.');
    }

    // B. Check if any seat is already booked in DB
    const alreadyBooked = dbSeats.filter(s => s.status === 'booked');
    if (alreadyBooked.length > 0) {
      const seatNums = alreadyBooked.map(s => s.seat_number).join(', ');
      throw new Error(`Seats [${seatNums}] are already booked.`);
    }

    // C. Check Redis locks to ensure seats are still ours or available
    for (const seatId of seatIds) {
      const lockKey = `lock:seat:${eventId}:${seatId}`;
      const lockHolder = await redisClient.get(lockKey);
      
      if (lockHolder && lockHolder !== userId) {
        throw new Error(`Seat reservation has expired or belongs to someone else.`);
      }
    }

    // D. Fetch the event details to calculate price
    const [eventResult] = await dbClient.query('SELECT ticket_price FROM events WHERE id = ?', [eventId]);
    if (eventResult.length === 0) {
      throw new Error('Event not found.');
    }
    const ticketPrice = eventResult[0].ticket_price;
    const totalAmount = ticketPrice * seatIds.length;

    // E. Create Booking Record
    const bookingId = crypto.randomUUID();
    await dbClient.query(
      'INSERT INTO bookings (id, user_id, event_id, total_amount, status) VALUES (?, ?, ?, ?, ?)',
      [bookingId, userId, eventId, totalAmount, 'confirmed']
    );

    // F. Map Booking to Seats (Insert into booking_seats)
    const bookingSeatsValues = seatIds.map(seatId => [bookingId, seatId]);
    await dbClient.query(
      'INSERT INTO booking_seats (booking_id, seat_id) VALUES ?',
      [bookingSeatsValues]
    );

    // G. Update Seats status in DB
    await dbClient.query(
      `UPDATE seats SET status = ? WHERE id IN (${placeholders})`,
      ['booked', ...seatIds]
    );

    // Commit transaction
    await dbClient.commit();

    // H. Release Redis locks since purchase is confirmed
    for (const seatId of seatIds) {
      const lockKey = `lock:seat:${eventId}:${seatId}`;
      await redisClient.del(lockKey);
    }

    res.json({
      message: 'Booking completed successfully!',
      bookingId,
      totalAmount,
      seats: dbSeats.map(s => s.seat_number),
    });

  } catch (err) {
    // Rollback transaction on failure
    await dbClient.rollback();
    console.error('Booking transaction rolled back due to error:', err.message);
    res.status(409).json({ error: err.message || 'Server error during booking checkout.' });
  } finally {
    // Release client back to pool
    dbClient.release();
  }
});

// 4. Fetch User Bookings
router.get('/user', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT 
        b.id as booking_id,
        b.total_amount,
        b.created_at,
        e.title as event_title,
        e.date as event_date,
        e.venue as event_venue,
        GROUP_CONCAT(s.seat_number ORDER BY s.seat_number ASC SEPARATOR ', ') as booked_seats
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      JOIN booking_seats bs ON b.id = bs.booking_id
      JOIN seats s ON bs.seat_id = s.id
      WHERE b.user_id = ?
      GROUP BY b.id, e.title, e.date, e.venue, b.total_amount, b.created_at
      ORDER BY b.created_at DESC
    `;
    const [result] = await pool.query(query, [userId]);
    res.json(result);
  } catch (err) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ error: 'Server error fetching bookings.' });
  }
});

export default router;
