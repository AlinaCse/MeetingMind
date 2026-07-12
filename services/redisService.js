const { createClient } = require('redis');
const crypto = require('crypto');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 1500,
    reconnectStrategy: () => false
  }
});
redisClient.on('error', (error) => console.error('Redis error:', error.message));

/** Connects Redis without making caching a startup dependency. */
async function connectRedis() {
  if (!redisClient.isOpen) {
    try { await redisClient.connect(); console.log('Redis connected'); }
    catch (error) { console.warn('Redis unavailable; AI caching is disabled:', error.message); }
  }
}

/** Returns cached analysis for normalized meeting notes. */
async function getCached(notes) {
  if (!redisClient.isOpen) return null;
  const hash = crypto.createHash('md5').update(notes.trim().toLowerCase()).digest('hex');
  const cached = await redisClient.get(`meeting:${hash}`);
  return cached ? JSON.parse(cached) : null;
}

/** Caches analysis for normalized meeting notes for one day. */
async function setCache(notes, result) {
  if (!redisClient.isOpen) return;
  const hash = crypto.createHash('md5').update(notes.trim().toLowerCase()).digest('hex');
  await redisClient.set(`meeting:${hash}`, JSON.stringify(result), { EX: 86400 });
}

/** Closes the Redis connection during graceful shutdown. */
async function closeRedis() { if (redisClient.isOpen) await redisClient.quit(); }
module.exports = { connectRedis, getCached, setCache, closeRedis };
