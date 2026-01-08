// api/limits.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './_lib/prisma.js'; // Ensure this matches 'export const prisma' in _lib/prisma.ts

const PLAN_MAX_CREDITS = {
  FREE: 5000,
  NEW_TUBER: 50000,
  CREATOR: 150000,
  PRO: 500000,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // KILL CACHING
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    // 1. Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        plan: true, 
        credits: true 
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const plan = user.plan || 'FREE';
    const currentBalance = user.credits ?? 0;
    const totalLimit = (PLAN_MAX_CREDITS as any)[plan] || 5000;

    // 2. Count total videos ever created for the UI stats
    const totalUsed = await prisma.generation.count({
      where: { userId }
    });

    // 3. Send single clean response
    return res.json({
      creditsRemaining: currentBalance,
      totalLimit: totalLimit,
      plan: plan,
      totalVideosCreated: totalUsed,
      allowed: currentBalance > 0,
    });

  } catch (error) {
    console.error("Limits Error:", error);
    return res.status(500).json({ 
        creditsRemaining: 0, 
        totalLimit: 5000, 
        plan: 'FREE', 
        allowed: false 
    });
  }
}
