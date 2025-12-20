// api/checkout.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { variantId, userId, userEmail } = req.body || {};

  if (!variantId || !userId) {
    return res.status(400).json({ error: 'Missing variantId or userId' });
  }

  // ✅ Add validation: ensure variantId is a number
  const variantIdNum = parseInt(variantId, 10);
  if (isNaN(variantIdNum)) {
    return res.status(400).json({ error: 'Invalid variantId: must be a number' });
  }

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

  // ✅ Return JSON error if missing
  if (!apiKey) {
    console.error('❌ LEMON_SQUEEZY_API_KEY is missing');
    return res.status(500).json({ error: 'Server misconfigured: missing API key' });
  }
  if (!storeId) {
    console.error('❌ LEMON_SQUEEZY_STORE_ID is missing');
    return res.status(500).json({ error: 'Server misconfigured: missing store ID' });
  }

  try {
    const storeIdNum = parseInt(storeId, 10);
    if (isNaN(storeIdNum)) {
      return res.status(500).json({ error: 'Invalid STORE_ID: must be a number' });
    }

    const lemonRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
         {
          type: 'checkouts',
          attributes: {
            store_id: storeIdNum,
            variant_id: variantIdNum,
            checkout_ {
              email: userEmail || undefined,
              custom: { user_id: userId },
            },
            product_options: {
              redirect_url: 'https://aivideonarrator.com/pricing?success=true',
              cancel_url: 'https://aivideonarrator.com/pricing',
            },
          },
        },
      }),
    });

    const data = await lemonRes.json();

    if (!lemonRes.ok) {
      console.error('🍋 Lemon Squeezy API error:', data);
      return res.status(lemonRes.status).json({ error: 'Failed to create checkout', details: data });
    }

    res.status(200).json({ url: data.data.attributes.url });
  } catch (error: any) {
    console.error('💥 Unexpected error in /api/checkout:', error.message || error);
    // ✅ Always return JSON, never let it crash to HTML
    res.status(500).json({ error: 'Internal server error', message: error.message || 'Unknown' });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
