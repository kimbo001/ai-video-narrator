// api/webhooks/lemon.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rawBody = await new Promise<Buffer>((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });

  const signature = req.headers['x-signature'] as string;
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify signature
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(rawBody).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Parse and handle the event
  const event = JSON.parse(rawBody.toString());

  const eventName = event.meta?.event_name;
  const customData = event.meta?.custom_data;
  const userId = customData?.user_id;

  if (!userId) {
    console.warn('No user_id in webhook custom data');
  }

  console.log(`Webhook received: ${eventName} for user ${userId}`);

  // Handle specific events (upgrade user in your DB)
  switch (eventName) {
    case 'subscription_created':
    case 'order_created':
      // TODO: Mark user as paid, set tier based on variant_id
      // e.g., await updateUserTier(userId, 'Pro');
      break;

    case 'subscription_cancelled':
      // Downgrade or revoke access
      break;

    case 'subscription_payment_failed':
      // Handle failed payment
      break;

    // Add more as needed
  }

  // Always respond 200 OK so Lemon doesn't retry
  res.status(200).json({ success: true });
}

// Important for raw body (signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
};
