// api/_lib/redis.js
import { createClient } from 'redis'

const client = createClient({
  url: process.env.REDIS_CLOUD_URL, 
  // Add a timeout so cold starts don't hang your API forever
  socket: {
    connectTimeout: 5000 
  }
})

client.on('error', (err) => {
  // Only log non-OOM errors as "Errors"
  if (!err.message.includes('OOM')) {
    console.error('Redis Client Error:', err);
  }
});

async function ensureConnected() {
  if (!client.isOpen) {
    await client.connect();
  }
}

export async function getCachedNarration(hash) {
  try {
    await ensureConnected();
    return await client.get(`narr:${hash}`);
  } catch (err) {
    console.warn("Redis Get Failed (Skipping Cache):", err.message);
    return null; // Fallback to generating new audio if Redis is down
  }
}

export async function setCachedNarration(hash, audio, ttl = 604800) { 
  try {
    await ensureConnected();
    // Use a 7-day TTL to keep memory usage lower
    await client.setEx(`narr:${hash}`, ttl, audio);
  } catch (err) {
    // If Redis is full (OOM), we just log it and move on.
    // The user still gets their video, we just don't cache it.
    if (err.message.includes('OOM') || err.message.includes('maxmemory')) {
      console.warn("⚠️ REDIS IS FULL: Skipping cache for this narration.");
    } else {
      console.error("Redis Set Error:", err);
    }
  }
}

export default client;
