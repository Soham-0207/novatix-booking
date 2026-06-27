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

router.get('/process-contact', async (req, res) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    // Find messages older than 5 minutes that haven't been replied to
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const [messages] = await pool.query(`
      SELECT id, name, email, subject, message, created_at 
      FROM contact_messages 
      WHERE is_replied = FALSE AND created_at <= ?
    `, [fiveMinutesAgo]);

    let processedCount = 0;

    for (let msg of messages) {
      try {
        // Generate AI Response
        const prompt = `You are a helpful customer support assistant for NovaTix, an event ticketing platform.
A customer named ${msg.name} has submitted the following message via the contact form:
Subject: ${msg.subject}
Message: ${msg.message}

Please draft a polite, professional, and helpful response to this customer. Address them by their name. Do not include subject lines or "Dear Customer", just start with the body of the response formatted in HTML (use <p>, <ul>, etc. where appropriate). Keep it concise and relevant.`;

        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama3-8b-8192',
        });

        const aiResponseHtml = chatCompletion.choices[0]?.message?.content || "<p>Thank you for reaching out to us. We have received your message and our team is looking into it.</p>";

        // Send email
        await sendContactAutoResponseEmail(msg.email, msg.name, msg.subject, aiResponseHtml);
        
        // Mark as replied
        await pool.query('UPDATE contact_messages SET is_replied = TRUE WHERE id = ?', [msg.id]);
        
        processedCount++;
        console.log(`Processed and replied to contact message from ${msg.email}`);
      } catch (err) {
        console.error(`Failed to process message ${msg.id}:`, err);
      }
    }

    res.json({ 
      success: true, 
      message: 'Contact processing cron finished',
      processed: processedCount
    });

  } catch (error) {
    console.error('Contact Processing Error:', error);
    res.status(500).json({ message: 'Internal server error during contact processing' });
  }
});

export default router;
