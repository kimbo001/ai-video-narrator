// api/webhooks/lemon.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../src/lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const event = req.body;
  const eventName = event.meta.event_name;
  const clerkUserId = event.meta.custom_data.user_id; 
  const variantId = event.data.attributes.variant_id.toString();

  const plans: Record<string, string> = {
    "1160511": "NEW_TUBER",
    "1160512": "CREATOR",
    "1160514": "PRO"
  };

  if (eventName === 'subscription_created' || eventName === 'order_created') {
    const newPlan = plans[variantId] || "FREE";

    await prisma.user.update({
      where: { clerkId: clerkUserId },
      data: { plan: newPlan, lemonVariantId: variantId }
    });
  }

  res.status(200).send('Webhook Received');
}
