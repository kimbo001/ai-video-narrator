// api/webhooks/lemon.ts
import { prisma } from '../_lib/prisma.js'; // Use the shared instance with .js
import crypto from 'crypto';

export const config = {
  api: { bodyParser: false },
};

async function getRawBody(readable: any): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    const rawBody = await getRawBody(req);
    
    // Signature Verification
    const hmac = crypto.createHmac('sha256', secret || '');
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signature = Buffer.from(req.headers['x-signature'] || '', 'utf8');
    if (!crypto.timingSafeEqual(digest, signature)) return res.status(401).send('Invalid signature');

    const event = JSON.parse(rawBody.toString('utf8'));
    const { variant_id, user_email, customer_id } = event.data.attributes;
    const userId = event.meta.custom_data?.userId;
    const eventName = event.meta.event_name;

    const CREDIT_MAP: Record<string, number> = {
      '1160511': 50000, '1160512': 150000, '1160514': 500000
    };
    const PLAN_MAP: Record<string, any> = {
      '1160511': 'NEW_TUBER', '1160512': 'CREATOR', '1160514': 'PRO'
    };

    if (eventName === 'order_created' || eventName === 'subscription_created' || eventName === 'subscription_payment_success') {
      const creditsToAdd = CREDIT_MAP[String(variant_id)] || 0;
      const plan = PLAN_MAP[String(variant_id)] || 'FREE';

      if (userId) {
        await prisma.user.upsert({
          where: { id: userId },
          create: { id: userId, email: user_email, plan: plan, credits: creditsToAdd, subscriptionId: String(customer_id) },
          update: { plan: plan, credits: { increment: creditsToAdd }, subscriptionId: String(customer_id) }
        });
        console.log(`✅ Webhook Success: Added ${creditsToAdd} credits to ${userId}`);
      }
    }

    return res.status(200).send('Webhook processed');
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return res.status(500).send(`Error: ${err.message}`);
  }
}
