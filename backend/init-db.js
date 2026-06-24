import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function initDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });
    console.log('Connected to MySQL. Creating database if not exists...');
    await connection.query('CREATE DATABASE IF NOT EXISTS ticket_booking;');
    console.log('Database ticket_booking created or already exists.');
    await connection.end();
  } catch (err) {
    console.error('Error creating database:', err);
  }
}

initDB();
