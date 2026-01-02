// api/limits.ts
import { PrismaClient } from '@prisma/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// We use a global variable to prevent too many connections in serverless
const prisma = (global as any).prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (global as any).prisma = prisma;

const PLAN_LIMITS = {
  FREE: 3,
  NEW_TUBER: 5,
  CREATOR: 25,
  PRO: 99999,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // --- THE FIX: KILL ALL CACHING ---
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { userId } = req.query;
  if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'Missing userId' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    // Match your database "PRO" status to the limits
    const plan = user?.plan || 'FREE';
    const limit = (PLAN_LIMITS as any)[plan] || 3;

    // Standardize "Today" to midnight UTC to prevent timezone glitches
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const used = await prisma.generation.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    return res.json({
      used,
      limit,
      plan,
      allowed: used < limit,
    });
  } catch (error) {
    console.error("Limits Error:", error);
    return res.status(500).json({ used: 0, limit: 3, plan: 'FREE', allowed: true });
  }
}
