// src/lib/getUserTier.ts
import { db } from './prisma';

// Daily Limits Configuration
const LIMITS = {
  FREE: 3,        // 3 videos per day
  NEW_TUBER: 10,  // 10 videos per day
  CREATOR: 50,    // 50 videos per day
  PRO: 1000       // Effectively unlimited
};

export async function getUserDailyLimit(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  // Default to FREE if user not found in DB yet
  const plan = user?.plan || 'FREE';
  return LIMITS[plan];
}

export async function getUserPlan(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return user?.plan || 'FREE';
}
