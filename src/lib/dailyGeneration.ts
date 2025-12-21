// src/lib/dailyGeneration.ts
import { db } from './prisma';
import { startOfDay } from 'date-fns';

export async function incrementDailyGeneration(userId: string) {
  const today = startOfDay(new Date());

  await db.dailyGeneration.upsert({
    where: { userId_date: { userId, date: today } },
    update: { count: { increment: 1 } },
    create: { userId, date: today, count: 1 },
  });
}

export async function getTodayGenerationCount(userId: string): Promise<number> {
  const today = startOfDay(new Date());

  const record = await db.dailyGeneration.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  return record?.count ?? 0;
}
