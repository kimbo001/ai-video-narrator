// src/pages/api/limits.ts
import { db } from '@/lib/prisma'; // Ensure you have your prisma client exported here
import { getTodayGenerationCount } from '@/lib/dailyGeneration';
import { getUserDailyLimit, getUserPlan } from '@/lib/getUserTier';

export const config = {
  runtime: 'edge', // Optional: Remove if using standard Node.js runtime
};

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
    }

    const limit = await getUserDailyLimit(userId);
    const used = await getTodayGenerationCount(userId);
    const plan = await getUserPlan(userId);

    const isAllowed = used < limit;

    return new Response(
      JSON.stringify({
        limit,
        used,
        remaining: Math.max(0, limit - used),
        plan,
        allowed: isAllowed, // MATCHES Generator.tsx check
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Limits API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', allowed: true }), // Fallback to allow if DB fails
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
