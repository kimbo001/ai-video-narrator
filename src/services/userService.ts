// src/services/userService.ts
import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ----------  Prisma 7 needs an adapter ----------
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

/* --------------  business logic -------------- */

type TierLimits = {
  autoDaily: number;
  manualDaily: number;
  manual48h?: number;
};

type TierMap = {
  free: TierLimits;
  'new-tuber': TierLimits;
  creator: TierLimits;
  pro: TierLimits;
};

export const checkVideoLimits = async (userId: string, type: 'auto' | 'manual') => {
  try {
    const tier = await getUserTier(userId);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const userStats = await getUserStats(userId, today);

    const limits: TierMap = {
      free: { autoDaily: 3, manualDaily: 0.5, manual48h: 1 },
      'new-tuber': { autoDaily: 5, manualDaily: 5 },
      creator: { autoDaily: 25, manualDaily: 25 },
      pro: { autoDaily: Infinity, manualDaily: Infinity },
    };

    const limit = limits[tier as keyof TierMap] || limits.free;

    const autoUsed = userStats?.autoVideosToday ?? 0;
    const manualUsed = userStats?.manualVideosToday ?? 0;

    if (autoUsed >= limit.autoDaily) {
      throw new Error(`Daily AI video limit reached. You've used ${autoUsed}/${limit.autoDaily}. Upgrade for more daily videos.`);
    }
    if (manualUsed >= limit.manualDaily) {
      throw new Error(`Daily manual video limit reached. You've used ${manualUsed}/${limit.manualDaily}. Upgrade for more daily videos.`);
    }

    if (tier === 'free' && type === 'manual') {
      const last48h = await prisma.userStats.findFirst({
        where: { userId, date: { gte: yesterday }, manualVideos48h: { gt: 0 } },
      });
      if (last48h && last48h.date === yesterday) {
        throw new Error('Manual video limit: 1 per 48 hours. Upgrade for unlimited access.');
      }
    }

    return {
      allowed: true,
      remaining: {
        auto: limit.autoDaily - autoUsed,
        manual: limit.manualDaily - manualUsed,
      },
    };
  } catch (err) {
    console.error('Error checking video limits:', err);
    throw err;
  }
};

export const getUserStats = async (userId: string, date: string) => {
  try {
    return await prisma.userStats.findUnique({ where: { userId_date: { userId, date } } });
  } catch (err) {
    console.error('Error getting user stats:', err);
    return null;
  }
};

export const incrementVideoCount = async (userId: string, type: 'auto' | 'manual') => {
  try {
    const today = new Date().toISOString().split('T')[0];
    return await prisma.userStats.upsert({
      where: { userId_date: { userId, date: today } },
      update:
        type === 'auto'
          ? { autoVideosToday: { increment: 1 } }
          : { manualVideosToday: { increment: 1 }, manualVideos48h: { increment: 1 } },
      create: {
        userId,
        date: today,
        autoVideosToday: type === 'auto' ? 1 : 0,
        manualVideosToday: type === 'manual' ? 1 : 0,
        manualVideos48h: type === 'manual' ? 1 : 0,
      },
    });
  } catch (err) {
    console.error('Error incrementing video count:', err);
    throw err;
  }
};

export const getUserTier = async (userId: string): Promise<string> => {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: 'active', expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) return 'free';

    const tierMap: Record<string, string> = {
      'new-tuber-monthly': 'new-tuber',
      'creator-monthly': 'creator',
      'pro-monthly': 'pro',
    };
    return tierMap[sub.planId] || 'free';
  } catch (err) {
    console.error('Error getting user tier:', err);
    return 'free';
  }
};
