// api/_lib/statsService.ts
import { prisma } from './prisma'; // Use your existing api/_lib/prisma helper

export async function bumpVideoCounter() {
  // Replace 'globalStats' with your actual table name from schema.prisma
  // This is a standard atomic increment in Prisma
  return await prisma.globalStats.update({
    where: { id: 'main' }, // Or whatever your record ID is
    data: {
      videoCount: {
        increment: 1
      }
    }
  });
}
