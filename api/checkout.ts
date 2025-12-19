// api/checkout.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { variantId, userId, userEmail } = req.body || {};

  if (!variantId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    console.error('Missing Lemon env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const lemonRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            store_id: Number(storeId),
            variant_id: Number(variantId),
            checkout_data: {
              email: userEmail || null,
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
      console.error('Lemon API error:', data);
      return res.status(500).json({ error: 'Checkout creation failed' });
    }

    res.status(200).json({ url: data.data.attributes.url });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
