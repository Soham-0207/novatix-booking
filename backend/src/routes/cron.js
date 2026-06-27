import express from 'express';
import pool from '../config/db.js';
import { sendEventReminderEmail, sendContactAutoResponseEmail } from '../utils/email.js';
import Groq from 'groq-sdk';

const router = express.Router();


router.get('/reminders', async (req, res) => {
  try {
    // Vercel cron uses a bearer token, we can verify it if needed:
    // const authHeader = req.headers.authorization;
    // if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    //   return res.status(401).json({ message: 'Unauthorized' });
    // }

    const now = new Date();
    
    // Define time windows
    // 24 hours from now
    const next24hStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
    const next24hEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

    // 1 hour from now
    const next1hStart = new Date(now.getTime() + 0.5 * 60 * 60 * 1000);
    const next1hEnd = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);

    // --- 1. Find 24h Reminders ---
    const [bookings24h] = await pool.query(`
      SELECT b.id as booking_id, u.email, u.name as user_name, e.title, e.date, e.venue, e.timezone
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN events e ON b.event_id = e.id
      WHERE b.reminder_24h_sent = FALSE
      AND e.date BETWEEN ? AND ?
    `, [next24hStart, next24hEnd]);

    for (let booking of bookings24h) {
      const options = { 
        weekday: 'short', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', 
        timeZone: booking.timezone || 'UTC'
      };
      const formattedDate = new Date(booking.date).toLocaleString('en-US', options);

      try {
        await sendEventReminderEmail(booking.email, booking.user_name, booking.title, formattedDate, booking.venue, '24h');
        await pool.query('UPDATE bookings SET reminder_24h_sent = TRUE WHERE id = ?', [booking.booking_id]);
        console.log(`Sent 24h reminder to ${booking.email} for ${booking.title}`);
      } catch (err) {
        console.error('Failed to send 24h reminder:', err);
      }
    }

    // --- 2. Find 1h Reminders ---
    const [bookings1h] = await pool.query(`
      SELECT b.id as booking_id, u.email, u.name as user_name, e.title, e.date, e.venue, e.timezone
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN events e ON b.event_id = e.id
      WHERE b.reminder_1h_sent = FALSE
      AND e.date BETWEEN ? AND ?
    `, [next1hStart, next1hEnd]);

    for (let booking of bookings1h) {
      const options = { 
        weekday: 'short', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', 
        timeZone: booking.timezone || 'UTC'
      };
      const formattedDate = new Date(booking.date).toLocaleString('en-US', options);

      try {
        await sendEventReminderEmail(booking.email, booking.user_name, booking.title, formattedDate, booking.venue, '1h');
        await pool.query('UPDATE bookings SET reminder_1h_sent = TRUE WHERE id = ?', [booking.booking_id]);
        console.log(`Sent 1h reminder to ${booking.email} for ${booking.title}`);
      } catch (err) {
        console.error('Failed to send 1h reminder:', err);
      }
    }

    res.json({ 
      success: true, 
      message: 'Cron job finished successfully',
      sent24h: bookings24h.length,
      sent1h: bookings1h.length
    });

  } catch (error) {
    console.error('Cron Error:', error);
    res.status(500).json({ message: 'Internal server error during cron execution' });
  }
});

export default router;
