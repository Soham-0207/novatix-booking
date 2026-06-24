import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fixDb() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('Adding category column...');
    await pool.query('ALTER TABLE events ADD COLUMN category VARCHAR(50) DEFAULT "Uncategorized"');
    console.log('Column added successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error('Error adding column:', err.message);
    }
  }
  process.exit();
}

fixDb();
