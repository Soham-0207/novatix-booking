// Trigger restart
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

import pool from './config/db.js';
import redisClient from './config/redis.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import bookingRoutes from './routes/bookings.js';
import reviewRoutes from './routes/reviews.js';
import contactRoutes from './routes/contact.js';
import cronRoutes from './routes/cron.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // For demo purposes; configure properly in production
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/cron', cronRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const [dbCheck] = await pool.query('SELECT 1');
    const redisCheck = await redisClient.ping();
    res.json({
      status: 'UP',
      database: dbCheck.length > 0 ? 'CONNECTED' : 'DISCONNECTED',
      redis: redisCheck === 'PONG' ? 'CONNECTED' : 'DISCONNECTED',
    });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// Self-initializing Database function
async function initializeDatabase() {
  try {
    const dbName = process.env.DB_NAME || 'ticket_booking';
    
    // Create DB if not exists (handling connection directly if pool fails because DB doesn't exist is tricky,
    // so we assume the container created it or we create it here via a connection without DB name if needed.
    // Docker mysql image handles DB creation via env vars).
    
    const [res] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'events'
    `, [dbName]);
    
    const exists = res[0].count > 0;
    
    if (!exists || process.env.FORCE_DB_INIT === 'true') {
      console.log('Initializing MySQL database schema and seed data...');
      const schemaPath = path.join(__dirname, 'db', 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Split schema into individual queries (MySQL node client doesn't support multiple statements by default without multipleStatements: true)
      // Actually, it's safer to just execute statements one by one or enable multiple statements.
      // Let's enable multipleStatements temporarily or just seed data programmatically if tables exist.
      // For simplicity, we assume tables are created by schema.sql manually or we parse it.
      // Better: let's execute schema commands manually if needed, or rely on a script.
      // Actually, mysql2 supports multipleStatements if configured, but let's just create tables if not exists programmatically.

      const createTablesQueries = [
        `CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(100) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS events (
            id VARCHAR(36) PRIMARY KEY, title VARCHAR(150) NOT NULL, description TEXT, date DATETIME NOT NULL, duration_hours INT DEFAULT 2, venue VARCHAR(150) NOT NULL, total_seats INT NOT NULL, ticket_price DECIMAL(10, 2) NOT NULL, image_url VARCHAR(255), category VARCHAR(50) DEFAULT 'Uncategorized', timezone VARCHAR(50) DEFAULT 'UTC', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS seats (
            id VARCHAR(36) PRIMARY KEY, event_id VARCHAR(36) NOT NULL, seat_number VARCHAR(10) NOT NULL, status VARCHAR(20) DEFAULT 'available', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE, UNIQUE KEY unique_event_seat (event_id, seat_number)
        )`,
        `CREATE TABLE IF NOT EXISTS bookings (
            id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, event_id VARCHAR(36) NOT NULL, total_amount DECIMAL(10, 2) NOT NULL, status VARCHAR(20) DEFAULT 'confirmed', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS booking_seats (
            booking_id VARCHAR(36) NOT NULL, seat_id VARCHAR(36) NOT NULL, PRIMARY KEY (booking_id, seat_id), FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE, FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS reviews (
            id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, event_id VARCHAR(36) NOT NULL, rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5), comment TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS contact_messages (
            id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), name VARCHAR(100) NOT NULL, email VARCHAR(100) NOT NULL, subject VARCHAR(150) NOT NULL, message TEXT NOT NULL, is_replied BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )`
      ];

      for (const query of createTablesQueries) {
         await pool.query(query);
      }

      // Check if events need seeding
      const [eventCount] = await pool.query('SELECT COUNT(*) as count FROM events');
      if (eventCount[0].count === 0 || process.env.FORCE_DB_INIT === 'true') {
          // Clear existing for force init
          if (process.env.FORCE_DB_INIT === 'true') {
              await pool.query('DELETE FROM events'); // cascade deletes seats
          }

          console.log('Seeding events...');
          const events = [
              { id: crypto.randomUUID(), title: 'Tech Innovation Summit 2026', desc: 'Join global tech leaders discussing Artificial Intelligence.', date: '2026-09-15 09:00:00', venue: 'Silicon Valley Convention Center', seats: 50, price: 12000.00, img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60', category: 'Technology' },
              { id: crypto.randomUUID(), title: 'Rock in Rio Concert', desc: 'An unforgettable night of pure rock and roll.', date: '2026-10-05 18:00:00', venue: 'Rio Stadium Arena', seats: 80, price: 6800.00, img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60', category: 'Festivals' },
              { id: crypto.randomUUID(), title: 'Grand Symphony Orchestra', desc: 'Classical masterpieces performed live.', date: '2026-11-20 19:30:00', venue: 'Metropolitan Concert Hall', seats: 40, price: 9500.00, img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=60', category: 'Music' },
              { id: crypto.randomUUID(), title: 'Bollywood Music Carnival', desc: 'Dance to the best Bollywood hits with live performances.', date: '2026-12-10 17:00:00', venue: 'Mumbai Open Grounds', seats: 100, price: 4500.00, img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60', category: 'Festivals' },
              { id: crypto.randomUUID(), title: 'International Standup Comedy Night', desc: 'Laugh out loud with top comedians from around the world.', date: '2027-01-15 20:00:00', venue: 'Comedy Club Main Stage', seats: 60, price: 2500.00, img: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&auto=format&fit=crop&q=60', category: 'Entertainment' },
              { id: crypto.randomUUID(), title: 'IPL Cricket Match Screening', desc: 'Experience the thrill of the IPL finals on the giant screen.', date: '2027-05-25 19:00:00', venue: 'Sports Bar Lounge', seats: 80, price: 1200.00, img: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=60', category: 'Sports' },
              { id: crypto.randomUUID(), title: 'Modern Art Exhibition', desc: 'Explore breathtaking pieces from contemporary artists around the globe.', date: '2026-08-20 10:00:00', venue: 'National Art Gallery', seats: 150, price: 800.00, img: '/modern_art.png', category: 'Arts & Culture' },
              { id: crypto.randomUUID(), title: 'Global Street Food Festival', desc: 'Taste authentic street food from over 50 countries.', date: '2026-09-05 12:00:00', venue: 'City Center Park', seats: 200, price: 500.00, img: '/food_festival.png', category: 'Food & Drink' },
              { id: crypto.randomUUID(), title: 'React Masters Workshop', desc: 'An intensive 2-day coding workshop for advanced React patterns.', date: '2026-10-12 09:00:00', venue: 'Tech Hub Building', seats: 40, price: 3500.00, img: '/react_workshop.png', category: 'Workshops' },
              { id: crypto.randomUUID(), title: 'Phantom of the Opera', desc: 'The classic Broadway musical comes to town for a limited run.', date: '2026-11-05 19:30:00', venue: 'Grand Theater', seats: 120, price: 8500.00, img: '/phantom_opera.png', category: 'Theater & Arts' },
              { id: crypto.randomUUID(), title: 'Annual Charity Gala', desc: 'A black-tie event to raise funds for global education initiatives.', date: '2026-12-20 18:00:00', venue: 'The Ritz Carlton Ballroom', seats: 60, price: 15000.00, img: '/charity_gala.png', category: 'Charity' }
          ];

          for (const ev of events) {
              await pool.query('INSERT INTO events (id, title, description, date, venue, total_seats, ticket_price, image_url, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [ev.id, ev.title, ev.desc, ev.date, ev.venue, ev.seats, ev.price, ev.img, ev.category]);
              
              // Seed seats for event
              console.log(`Seeding seats for ${ev.title}...`);
              const rowsNeeded = Math.ceil(ev.seats / 10);
              let seatValues = [];
              for (let r = 1; r <= rowsNeeded; r++) {
                  const rowChar = String.fromCharCode(64 + r);
                  for (let s = 1; s <= 10; s++) {
                      if (((r - 1) * 10 + s) <= ev.seats) {
                          seatValues.push([crypto.randomUUID(), ev.id, `${rowChar}${s}`, 'available']);
                      }
                  }
              }
              if (seatValues.length > 0) {
                  await pool.query('INSERT INTO seats (id, event_id, seat_number, status) VALUES ?', [seatValues]);
              }
          }
          console.log('Database successfully initialized and seeded.');
      } else {
          console.log('Events already seeded. Skipping initialization.');
      }
    } else {
      console.log('Database tables already exist. Skipping initialization.');
    }
    
    // Add is_replied column to contact_messages if it doesn't exist (safe alter)
    try {
      await pool.query('ALTER TABLE contact_messages ADD COLUMN is_replied BOOLEAN DEFAULT FALSE');
      console.log('Added is_replied column to contact_messages.');
    } catch (alterErr) {
      if (alterErr.code === 'ER_DUP_FIELDNAME') {
        // Column already exists, all good
      } else {
        console.error('Error altering contact_messages:', alterErr.message);
      }
    }
  } catch (err) {
    console.error('Error checking/initializing database:', err);
  }
}

// Start Server or Export for Vercel
// Trigger restart
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

import pool from './config/db.js';
import redisClient from './config/redis.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import bookingRoutes from './routes/bookings.js';
import reviewRoutes from './routes/reviews.js';
import contactRoutes from './routes/contact.js';
import cronRoutes from './routes/cron.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // For demo purposes; configure properly in production
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/cron', cronRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const [dbCheck] = await pool.query('SELECT 1');
    const redisCheck = await redisClient.ping();
    res.json({
      status: 'UP',
      database: dbCheck.length > 0 ? 'CONNECTED' : 'DISCONNECTED',
      redis: redisCheck === 'PONG' ? 'CONNECTED' : 'DISCONNECTED',
    });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// Self-initializing Database function
async function initializeDatabase() {
  try {
    const dbName = process.env.DB_NAME || 'ticket_booking';
    
    // Create DB if not exists (handling connection directly if pool fails because DB doesn't exist is tricky,
    // so we assume the container created it or we create it here via a connection without DB name if needed.
    // Docker mysql image handles DB creation via env vars).
    
    const [res] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'events'
    `, [dbName]);
    
    const exists = res[0].count > 0;
    
    if (!exists || process.env.FORCE_DB_INIT === 'true') {
      console.log('Initializing MySQL database schema and seed data...');
      const schemaPath = path.join(__dirname, 'db', 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Split schema into individual queries (MySQL node client doesn't support multiple statements by default without multipleStatements: true)
      // Actually, it's safer to just execute statements one by one or enable multiple statements.
      // Let's enable multipleStatements temporarily or just seed data programmatically if tables exist.
      // For simplicity, we assume tables are created by schema.sql manually or we parse it.
      // Better: let's execute schema commands manually if needed, or rely on a script.
      // Actually, mysql2 supports multipleStatements if configured, but let's just create tables if not exists programmatically.

      const createTablesQueries = [
        `CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(100) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS events (
            id VARCHAR(36) PRIMARY KEY, title VARCHAR(150) NOT NULL, description TEXT, date DATETIME NOT NULL, duration_hours INT DEFAULT 2, venue VARCHAR(150) NOT NULL, total_seats INT NOT NULL, ticket_price DECIMAL(10, 2) NOT NULL, image_url VARCHAR(255), category VARCHAR(50) DEFAULT 'Uncategorized', timezone VARCHAR(50) DEFAULT 'UTC', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS seats (
            id VARCHAR(36) PRIMARY KEY, event_id VARCHAR(36) NOT NULL, seat_number VARCHAR(10) NOT NULL, status VARCHAR(20) DEFAULT 'available', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE, UNIQUE KEY unique_event_seat (event_id, seat_number)
        )`,
        `CREATE TABLE IF NOT EXISTS bookings (
            id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, event_id VARCHAR(36) NOT NULL, total_amount DECIMAL(10, 2) NOT NULL, status VARCHAR(20) DEFAULT 'confirmed', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS booking_seats (
            booking_id VARCHAR(36) NOT NULL, seat_id VARCHAR(36) NOT NULL, PRIMARY KEY (booking_id, seat_id), FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE, FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS reviews (
            id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, event_id VARCHAR(36) NOT NULL, rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5), comment TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS contact_messages (
            id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36), name VARCHAR(100) NOT NULL, email VARCHAR(100) NOT NULL, subject VARCHAR(150) NOT NULL, message TEXT NOT NULL, is_replied BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )`
      ];

      for (const query of createTablesQueries) {
         await pool.query(query);
      }

      // Check if events need seeding
      const [eventCount] = await pool.query('SELECT COUNT(*) as count FROM events');
      if (eventCount[0].count === 0 || process.env.FORCE_DB_INIT === 'true') {
          // Clear existing for force init
          if (process.env.FORCE_DB_INIT === 'true') {
              await pool.query('DELETE FROM events'); // cascade deletes seats
          }

          console.log('Seeding events...');
          const events = [
              { id: crypto.randomUUID(), title: 'Tech Innovation Summit 2026', desc: 'Join global tech leaders discussing Artificial Intelligence.', date: '2026-09-15 09:00:00', venue: 'Silicon Valley Convention Center', seats: 50, price: 12000.00, img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60', category: 'Technology' },
              { id: crypto.randomUUID(), title: 'Rock in Rio Concert', desc: 'An unforgettable night of pure rock and roll.', date: '2026-10-05 18:00:00', venue: 'Rio Stadium Arena', seats: 80, price: 6800.00, img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60', category: 'Festivals' },
              { id: crypto.randomUUID(), title: 'Grand Symphony Orchestra', desc: 'Classical masterpieces performed live.', date: '2026-11-20 19:30:00', venue: 'Metropolitan Concert Hall', seats: 40, price: 9500.00, img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=60', category: 'Music' },
              { id: crypto.randomUUID(), title: 'Bollywood Music Carnival', desc: 'Dance to the best Bollywood hits with live performances.', date: '2026-12-10 17:00:00', venue: 'Mumbai Open Grounds', seats: 100, price: 4500.00, img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60', category: 'Festivals' },
              { id: crypto.randomUUID(), title: 'International Standup Comedy Night', desc: 'Laugh out loud with top comedians from around the world.', date: '2027-01-15 20:00:00', venue: 'Comedy Club Main Stage', seats: 60, price: 2500.00, img: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&auto=format&fit=crop&q=60', category: 'Entertainment' },
              { id: crypto.randomUUID(), title: 'IPL Cricket Match Screening', desc: 'Experience the thrill of the IPL finals on the giant screen.', date: '2027-05-25 19:00:00', venue: 'Sports Bar Lounge', seats: 80, price: 1200.00, img: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=60', category: 'Sports' },
              { id: crypto.randomUUID(), title: 'Modern Art Exhibition', desc: 'Explore breathtaking pieces from contemporary artists around the globe.', date: '2026-08-20 10:00:00', venue: 'National Art Gallery', seats: 150, price: 800.00, img: '/modern_art.png', category: 'Arts & Culture' },
              { id: crypto.randomUUID(), title: 'Global Street Food Festival', desc: 'Taste authentic street food from over 50 countries.', date: '2026-09-05 12:00:00', venue: 'City Center Park', seats: 200, price: 500.00, img: '/food_festival.png', category: 'Food & Drink' },
              { id: crypto.randomUUID(), title: 'React Masters Workshop', desc: 'An intensive 2-day coding workshop for advanced React patterns.', date: '2026-10-12 09:00:00', venue: 'Tech Hub Building', seats: 40, price: 3500.00, img: '/react_workshop.png', category: 'Workshops' },
              { id: crypto.randomUUID(), title: 'Phantom of the Opera', desc: 'The classic Broadway musical comes to town for a limited run.', date: '2026-11-05 19:30:00', venue: 'Grand Theater', seats: 120, price: 8500.00, img: '/phantom_opera.png', category: 'Theater & Arts' },
              { id: crypto.randomUUID(), title: 'Annual Charity Gala', desc: 'A black-tie event to raise funds for global education initiatives.', date: '2026-12-20 18:00:00', venue: 'The Ritz Carlton Ballroom', seats: 60, price: 15000.00, img: '/charity_gala.png', category: 'Charity' }
          ];

          for (const ev of events) {
              await pool.query('INSERT INTO events (id, title, description, date, venue, total_seats, ticket_price, image_url, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [ev.id, ev.title, ev.desc, ev.date, ev.venue, ev.seats, ev.price, ev.img, ev.category]);
              
              // Seed seats for event
              console.log(`Seeding seats for ${ev.title}...`);
              const rowsNeeded = Math.ceil(ev.seats / 10);
              let seatValues = [];
              for (let r = 1; r <= rowsNeeded; r++) {
                  const rowChar = String.fromCharCode(64 + r);
                  for (let s = 1; s <= 10; s++) {
                      if (((r - 1) * 10 + s) <= ev.seats) {
                          seatValues.push([crypto.randomUUID(), ev.id, `${rowChar}${s}`, 'available']);
                      }
                  }
              }
              if (seatValues.length > 0) {
                  await pool.query('INSERT INTO seats (id, event_id, seat_number, status) VALUES ?', [seatValues]);
              }
          }
          console.log('Database successfully initialized and seeded.');
      } else {
          console.log('Events already seeded. Skipping initialization.');
      }
    } else {
      console.log('Database tables already exist. Skipping initialization.');
    }
    
    // Add is_replied column to contact_messages if it doesn't exist (safe alter)
    try {
      await pool.query('ALTER TABLE contact_messages ADD COLUMN is_replied BOOLEAN DEFAULT FALSE');
      console.log('Added is_replied column to contact_messages.');
    } catch (alterErr) {
      if (alterErr.code === 'ER_DUP_FIELDNAME') {
        // Column already exists, all good
      } else {
        console.error('Error altering contact_messages:', alterErr.message);
      }
    }
  } catch (err) {
    console.error('Error checking/initializing database:', err);
  }
}

// Start Server or Export for Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    setTimeout(initializeDatabase, 3000);
  });
} else {
  // In production serverless environments, attempt initialization once
  initializeDatabase().catch(console.error);
}

export default app;
