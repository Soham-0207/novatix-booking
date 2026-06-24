import mysql from 'mysql2/promise';

async function tryConnect(pwd) {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: pwd,
      port: 3306
    });
    console.log(`SUCCESS with password: "${pwd}"`);
    await connection.query('CREATE DATABASE IF NOT EXISTS ticket_booking;');
    await connection.end();
    return true;
  } catch (err) {
    console.log(`FAILED with password: "${pwd}"`);
    return false;
  }
}

async function run() {
  const p1 = await tryConnect('');
  if (p1) process.exit(0);
  const p2 = await tryConnect('root');
  if (p2) process.exit(0);
  
  console.log('ALL ATTEMPTS FAILED');
}

run();
