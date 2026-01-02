// api/_lib/redis.js
import { createClient } from 'redis'

const client = createClient({
  url: process.env.REDIS_CLOUD_URL,   // redis://... from Redis Cloud
})

await client.connect()

export async function getCachedNarration(hash) {
  return client.get(`narr:${hash}`)
}
export async function setCachedNarration(hash, audio, ttl = 86400 * 30) {
  await client.setEx(`narr:${hash}`, ttl, audio)
}
