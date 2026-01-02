import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// 1. Initialize Prisma (Inline to avoid import errors)
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const db = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// 2. Disable Vercel's default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// 3. Helper to read the raw body stream
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
    if (!secret) return res.status(500).send("Missing Secret");

    const rawBody = await getRawBody(req);
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signature = Buffer.from(req.headers['x-signature'] || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signature)) return res.status(401).send('Invalid signature');

    const event = JSON.parse(rawBody.toString('utf8'));
    const { variant_id, user_email, customer_id } = event.data.attributes;
    
    // --- CLERK DATA ---
    const userId = event.meta.custom_data?.userId;
    const clerkEmail = event.meta.custom_data?.userEmail; // We look for this now
    const finalEmail = clerkEmail || user_email; // Clerk email wins, Payment email is backup
    // ------------------

    const eventName = event.meta.event_name;

    const PLANS_MAP: Record<string, 'NEW_TUBER' | 'CREATOR' | 'PRO'> = {
      '1160511': 'NEW_TUBER',
      '1160512': 'CREATOR',
      '1160514': 'PRO'
    };

    if (
      eventName === 'order_created' || 
      eventName === 'subscription_created' || 
      eventName === 'subscription_updated' ||
      eventName === 'subscription_payment_success'
    ) {
      const plan = PLANS_MAP[String(variant_id)];
      
      if (plan && userId) {
        // FIX: Remove anyone else using the email we are about to save
        await db.user.deleteMany({
          where: {
            email: finalEmail,
            id: { not: userId }
          }
        });

        await db.user.upsert({
          where: { id: userId },
          create: {
            id: userId,
            email: finalEmail, // Uses Clerk Email
            plan: plan,
            subscriptionId: String(customer_id)
          },
          update: {
            plan: plan,
            subscriptionId: String(customer_id),
            email: finalEmail // Updates to Clerk Email if it changed
          }
        });
        console.log(`User ${userId} synced with email ${finalEmail}`);
      }
    }
    
    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
        const subId = String(event.data.id);
        await db.user.updateMany({
            where: { subscriptionId: subId },
            data: { plan: 'FREE' }
        });
    }

    return res.status(200).send('Webhook processed');
  } catch (err: any) {
    return res.status(500).send(`Webhook Error: ${err.message}`);
  }
}
