import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl,
  socket: {
    tls: redisUrl.startsWith('rediss://'),
    rejectUnauthorized: false
  }
});

let isRedisConnected = false;

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
  isRedisConnected = false;
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully.');
  isRedisConnected = true;
});

// Establish connection gracefully without crashing
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.warn('Failed to connect to Redis initially. The app will continue, but seat locking might be affected.');
  }
})();

// Wrapper for graceful failures
const clientWrapper = {
  get: async (key) => {
    if (!isRedisConnected) return null;
    try { return await redisClient.get(key); } catch (e) { return null; }
  },
  set: async (key, value, options) => {
    if (!isRedisConnected) return true; // Pretend it acquired the lock if Redis is down
    try { return await redisClient.set(key, value, options); } catch (e) { return true; }
  },
  del: async (key) => {
    if (!isRedisConnected) return;
    try { await redisClient.del(key); } catch (e) {}
  },
  mGet: async (keys) => {
    if (!isRedisConnected || !keys || keys.length === 0) return keys.map(() => null);
    try { return await redisClient.mGet(keys); } catch (e) { return keys.map(() => null); }
  },
  ping: async () => {
    if (!isRedisConnected) return 'FAILED';
    try { return await redisClient.ping(); } catch (e) { return 'FAILED'; }
  }
};

export default clientWrapper;
