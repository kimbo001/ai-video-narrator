// api/webhooks/lemon.ts
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// 1. Initialize Prisma
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const db = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    if (!secret) return res.status(500).send("Server Error: Missing Secret");

    // 2. Validate Signature
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(JSON.stringify(req.body)).digest('hex'), 'utf8');
    const signature = Buffer.from(req.headers['x-signature'] || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signature)) {
      return res.status(401).send('Invalid signature');
    }

    // 3. Process Event
    const event = req.body;
    const { variant_id, user_email, customer_id } = event.data.attributes;
    const userId = event.meta.custom_data?.userId;
    const eventName = event.meta.event_name;

    console.log(`Processing ${eventName} for ${user_email} (ID: ${userId})`);

    const PLANS_MAP: Record<string, 'NEW_TUBER' | 'CREATOR' | 'PRO'> = {
      '1160511': 'NEW_TUBER',
      '1160512': 'CREATOR',
      '1160514': 'PRO'
    };

    if (eventName === 'order_created' || eventName === 'subscription_created' || eventName === 'subscription_updated') {
      const plan = PLANS_MAP[String(variant_id)];
      
      if (plan) {
        if (userId) {
          await db.user.upsert({
            where: { id: userId },
            create: {
              id: userId,
              email: user_email,
              plan: plan,
              subscriptionId: String(customer_id)
            },
            update: {
              plan: plan,
              subscriptionId: String(customer_id)
            }
          });
          console.log(`User ${userId} upgraded to ${plan}`);
        } else {
          await db.user.update({
              where: { email: user_email },
              data: { plan: plan, subscriptionId: String(customer_id) }
          }).catch(err => console.error("Fallback email update failed", err));
        }
      }
    }

    return res.status(200).send('Webhook processed');
  } catch (err: any) {
    console.error("Webhook Error:", err);
    return res.status(500).send('Webhook Error');
  }
}
