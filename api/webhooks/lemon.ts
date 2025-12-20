// api/webhooks/lemon.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get raw body for signature verification
  const rawBody = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  const signature = req.headers['x-signature'] as string;
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return res.status(401).json({ error: 'Missing secret or signature' });
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(rawBody).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody.toString());

  console.log('Webhook received:', event.meta?.event_name, 'for user:', event.meta?.custom_data?.user_id);

  // TODO: Handle events (upgrade user in DB)
  // switch (event.meta?.event_name) { ... }

  res.status(200).json({ success: true });
}

export const config = {
  api: {
    bodyParser: false,  // Critical for raw body
  },
};
