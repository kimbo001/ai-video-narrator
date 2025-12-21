// api/webhooks/lemon.ts
import { db } from '@/lib/prisma';
import { Tier } from '@/lib/tiers';

const VARIANT_TO_TIER: Record<string, Tier> = {
  '1160511': 'new_tuber',   // New Tuber - 10/day
  '1160512': 'creator',     // Creator - 25/day
  '1160514': 'pro',         // Pro - 50/day
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const eventName = body.meta?.event_name;
    const clerkUserId = body.meta?.custom_data?.user_id;
    const variantId = body.data?.attributes?.variant_id?.toString();
    const customerId = body.data?.attributes?.customer_id;

    if (!clerkUserId) {
      console.error('No clerkUserId in webhook');
      return new Response('Missing user_id', { status: 400 });
    }

    const tier = VARIANT_TO_TIER[variantId] || 'free';

    // Handle successful purchase or subscription
    if (
      eventName === 'order_created' ||
      eventName === 'subscription_created' ||
      eventName === 'subscription_updated'
    ) {
      await db.subscription.upsert({
        where: { userId: clerkUserId },
        update: {
          tier,
          status: 'active',
          lemonCustomerId: customerId,
        },
        create: {
          userId: clerkUserId,
          tier,
          status: 'active',
          lemonCustomerId: customerId,
        },
      });
    }

    // Handle cancellation or expiry → downgrade to free
    if (
      eventName === 'subscription_cancelled' ||
      eventName === 'subscription_expired'
    ) {
      await db.subscription.updateMany({
        where: { userId: clerkUserId },
        data: { tier: 'free', status: 'cancelled' },
      });
    }

    return new Response('Webhook processed', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false, // Important for webhooks — raw body needed for signature verification (if you add it later)
  },
};
