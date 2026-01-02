import { db } from './prisma';

const LIMITS: Record<string, number> = {
  FREE: 3,
  NEW_TUBER: 10,
  CREATOR: 50,
  PRO: 1000
};

export async function getUserDailyLimit(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  const plan = user?.plan || 'FREE';
  return LIMITS[plan] || 3;
}

export async function getUserPlan(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return user?.plan || 'FREE';
}
