// api/webhooks/lemon.ts
import { prisma } from '../_lib/prisma.js'; 
import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

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
    const eventName = event.meta.event_name;
    const attributes = event.data.attributes;

    // Grab the Variant ID from any possible location in the JSON
    const variantId = String(
      attributes.variant_id || 
      attributes.first_order_item?.variant_id || 
      event.data.relationships?.variant?.data?.id ||
      ""
    );

    const userId = event.meta.custom_data?.userId;
    const userEmail = attributes.user_email || attributes.email;
    
    console.log(`🔔 Webhook: ${eventName} | ID: ${variantId} | User: ${userId}`);

    // --- UPDATED CREDIT MAPPING ---
    const CREDIT_MAP: Record<string, number> = {
      '1160511': 50000,   // New Tuber
      '1160512': 150000,  // Creator
      '1160514': 500000,  // Pro
      '1204425': 20000    // ✅ POWER PASS (The Fix)
    };

    const PLAN_MAP: Record<string, any> = {
      '1160511': 'NEW_TUBER', 
      '1160512': 'CREATOR', 
      '1160514': 'PRO'
    };

    if (
      eventName === 'order_created' || 
      eventName === 'subscription_created' || 
      eventName === 'subscription_payment_success'
    ) {
      const creditsToAdd = CREDIT_MAP[variantId] || 0;
      const newPlan = PLAN_MAP[variantId];

      if (userId && creditsToAdd > 0) {
        const updated = await prisma.user.update({
          where: { id: userId },
          data: { 
            // Only update plan name if it's a subscription product
            ...(newPlan && { plan: newPlan }), 
            credits: { increment: creditsToAdd } 
          }
        });
        console.log(`✅ SUCCESS: Added ${creditsToAdd} credits. Total: ${updated.credits}`);
      }
    }

    return res.status(200).send('Webhook processed');
  } catch (err: any) {
    console.error("🔥 Webhook Error:", err.message);
    return res.status(500).send(`Error: ${err.message}`);
  }
}
