// src/lib/dailyGeneration.ts
import { db } from './prisma';

export async function getTodayGenerationCount(userId: string): Promise<number> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const count = await db.generation.count({
    where: {
      userId: userId,
      createdAt: {
        gte: startOfDay, // Greater than or equal to 00:00 today
      },
    },
  });

  return count;
}
