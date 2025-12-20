// server/routes/index.js
import express from 'express';
import crypto from 'crypto';
import { prisma } from '../../src/services/userService.js';

const router = express.Router();

router.get('/ping', (_req, res) => res.json({ pong: true }));

router.post('/paddle-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['paddle-signature'];
  if (!verifySig(req.body.toString(), sig, process.env.PADDLE_WEBHOOK_SECRET)) {
    return res.status(400).send('Bad signature');
  }
  const evt = JSON.parse(req.body.toString());
  console.log('Paddle event', evt.type, evt.data);

  const userId  = evt.data.customData?.userId;
  const priceId = evt.data.items?.[0]?.price?.id;
  const planMap = {
  [process.env.PADDLE_PRICE_NEW_TUBER || '']: 'new-tuber-monthly',
  [process.env.PADDLE_PRICE_CREATOR || '']:   'creator-monthly',
  [process.env.PADDLE_PRICE_PRO || '']:       'pro-monthly',
};
  const planId = planMap[priceId];

  if (evt.type === 'subscription.created' || evt.type === 'subscription.updated') {
    const expires = new Date(evt.data.nextBilledAt * 1000);
    await prisma.subscription.upsert({
      where: { paddleSubId: evt.data.id },
      update: { status: 'active', expiresAt: expires, planId },
      create: {
        userId,
        paddleSubId: evt.data.id,
        planId,
        status: 'active',
        expiresAt: expires,
      },
    });
  }
  if (evt.type === 'subscription.cancelled' || evt.type === 'subscription.past_due') {
    await prisma.subscription.updateMany({
      where: { paddleSubId: evt.data.id },
      data: { status: 'cancelled' },
    });
  }
  res.sendStatus(200);
});

function verifySig(body, signature, secret) {
  if (!signature) return false;
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  return signature === `sha256=${hash}`;
}

export default router;
