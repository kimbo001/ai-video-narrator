import { PrismaClient } from '@prisma/client';

// 1. Initialize Prisma safely
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const db = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

const LIMITS: Record<string, number> = {
  FREE: 3,
  NEW_TUBER: 10,
  CREATOR: 50,
  PRO: 1000
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // --- DATABASE OPERATIONS ---
    // We wrap these in their own try/catch so DB issues don't crash the request
    let plan = 'FREE';
    let used = 0;

    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { plan: true },
        });
        
        if (user?.plan) plan = user.plan;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        used = await db.generation.count({
            where: {
                userId: userId,
                createdAt: { gte: startOfDay },
            },
        });
    } catch (dbError) {
        console.error("Database Connection Failed:", dbError);
        // Do not crash. Just proceed with 'FREE' defaults.
    }
    // ---------------------------

    const limit = LIMITS[plan] || 3;

    return res.status(200).json({
      limit,
      used,
      remaining: Math.max(0, limit - used),
      plan,
      allowed: used < limit,
    });

  } catch (error: any) {
    console.error('Limits API Critical Error:', error);
    // Ultimate Fallback
    return res.status(200).json({ 
      limit: 3, 
      used: 0, 
      plan: 'FREE', 
      allowed: true 
    });
  }
}
