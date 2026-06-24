import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'ticket_booking',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (process.env.DATABASE_URL) {
  const parsed = new URL(process.env.DATABASE_URL);
  dbConfig = {
    host: parsed.hostname,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.substring(1),
    port: parsed.port,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };
}

const pool = mysql.createPool(dbConfig);

// Test DB connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL database pool connected.');
    connection.release();
  } catch (err) {
    console.error('Failed to connect to MySQL:', err.message);
  }
})();

export default pool;
