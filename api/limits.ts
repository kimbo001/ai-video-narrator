// api/limits.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../src/lib/prisma';

const LIMITS = { FREE: 3, NEW_TUBER: 5, CREATOR: 25, PRO: 1000 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

  try {
    // 1. Find user or create them if they don't exist yet
    let user = await prisma.user.findUnique({
      where: { clerkId: String(userId) },
      include: {
        _count: {
          select: {
            videos: {
              where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }
            }
          }
        }
      }
    });

    // If new user, create them in DB
    if (!user) {
        user = await prisma.user.create({
            data: { clerkId: String(userId), email: 'pending@user.com', plan: 'FREE' },
            include: { _count: { select: { videos: true } } }
        });
    }

    const plan = user.plan || "FREE";
    const used = user._count?.videos || 0;
    const limit = LIMITS[plan as keyof typeof LIMITS];

    // 2. Return the data to the Generator.tsx
    res.status(200).json({ plan, used, limit, allowed: used < limit });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch limits" });
  }
}
