// src/pages/api/limits.ts
import { db } from '@/lib/prisma';
import { getTodayGenerationCount } from '@/lib/dailyGeneration';
import { getUserDailyLimit } from '@/lib/getUserTier';

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Get userId from query param
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get limit and current count
    const limit = await getUserDailyLimit(userId);
    const used = await getTodayGenerationCount(userId);

    return new Response(
      JSON.stringify({
        limit,
        used,
        remaining: limit - used,
        canGenerate: used < limit,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Limits API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
