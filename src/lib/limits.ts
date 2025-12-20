import { prisma } from './prisma';

const LIMITS = {
  FREE: 3,
  NEW_TUBER: 5,
  CREATOR: 25,
  PRO: 1000 // Effectively unlimited
};

export async function checkLimit(clerkUserId: string) {
  // 1. Get user and count videos made today
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    include: {
      _count: {
        select: {
          videos: {
            where: {
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)) // Start of today
              }
            }
          }
        }
      }
    }
  });

  const plan = user?.plan || "FREE";
  const usedToday = user?._count.videos || 0;
  const max = LIMITS[plan as keyof typeof LIMITS];

  return {
    allowed: usedToday < max,
    used: usedToday,
    limit: max,
    plan: plan
  };
}
