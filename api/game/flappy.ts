// api/game/flappy.ts
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function obstacleHash(seed: number, frame: number) {
  return crypto.createHash('md5').update(`${seed}-${frame}`).digest('hex');
}

export default async function handler(req: any, res: any) {
  const today = new Date().toISOString().slice(0,10);
  const seed = parseInt(today.replace(/-/g,'')); // YYYYMMDD

  if (req.method==='GET') {
    const { userId } = req.query;
    const best = await prisma.flappyScore.findFirst({
      where: { userId, createdAt: { gte: new Date(today) } },
      orderBy: { score: 'desc' }
    });
    return res.json({ seed, best: best?.score || 0 });
  }

  if (req.method==='POST') {
    const { userId, score, seed: clientSeed } = req.body;
    if (clientSeed !== seed) return res.status(400).json({ error: 'invalid seed' });

    await prisma.flappyScore.create({ data: { userId, score, seed } });

    // daily top-3 coupons
    const leaders = await prisma.flappyScore.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: new Date(today) } },
      _max: { score: true },
      orderBy: { _max: { score: 'desc' } },
      take: 3
    });
    if (leaders.find(l => l.userId === userId && l._max.score === score)) {
      // generate Paddle 100 % off coupon (one-time, 1-month)
      const coupon = await paddle.coupons.create({
        description: 'Flappy Narrator Champion',
        type: 'percentage',
        amount: '100',
        currency_code: 'USD',
        max_redemptions: 1,
        expires_at: new Date(Date.now() + 30*24*60*60*1000)
      });
      return res.json({ couponCode: coupon.code });
    }
    res.json({ ok: true });
  }
}
