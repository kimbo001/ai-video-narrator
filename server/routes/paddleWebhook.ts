// server/routes/paddleWebhook.ts
import express from 'express';
import crypto from 'crypto';
import { prisma } from '../db'; // your Prisma instance

const router = express.Router();

function verifySignature(body: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  return signature === `sha256=${hash}`;
}

router.post('/paddle-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['paddle-signature'] as string;
  if (!verifySignature(req.body.toString(), sig, process.env.PADDLE_WEBHOOK_SECRET!)) {
    return res.status(400).send('Bad signature');
  }

  const event = JSON.parse(req.body.toString());
  console.log('Paddle webhook', event.type, event.data);

  const { userId } = event.data.customData; // we passed this in front-end
  const priceId = event.data.items?.[0]?.price?.id;

  const planMap: Record<string, string> = {
    [process.env.PADDLE_PRICE_NEW_TUBER!]: 'new-tuber-monthly',
    [process.env.PADDLE_PRICE_CREATOR!]: 'creator-monthly',
    [process.env.PADDLE_PRICE_PRO!]: 'pro-monthly',
  };
  const planId = planMap[priceId];

  if (event.type === 'subscription.created' || event.type === 'subscription.updated') {
    const expires = new Date(event.data.nextBilledAt * 1000);
    await prisma.subscription.upsert({
      where: { paddleSubId: event.data.id },
      update: { status: 'active', expiresAt: expires, planId },
      create: {
        userId,
        paddleSubId: event.data.id,
        planId,
        status: 'active',
        expiresAt: expires,
      },
    });
  }

  if (event.type === 'subscription.cancelled' || event.type === 'subscription.past_due') {
    await prisma.subscription.updateMany({
      where: { paddleSubId: event.data.id },
      data: { status: 'cancelled' },
    });
  }

  res.status(200).send('ok');
});
export default router;
