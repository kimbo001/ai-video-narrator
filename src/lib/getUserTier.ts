// src/lib/getUserTier.ts
import { db } from './prisma';
import { DAILY_LIMITS, Tier } from './tiers';

export async function getUserTier(userId: string): Promise<Tier> {
  if (!userId || userId.startsWith('anon-')) return 'free';

  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { tier: true, status: true },
  });

  if (subscription?.status === 'active') {
    return subscription.tier as Tier;
  }

  return 'free';
}

export async function getUserDailyLimit(userId: string): Promise<number> {
  const tier = await getUserTier(userId);
  return DAILY_LIMITS[tier];
}
