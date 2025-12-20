// api/checkout.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { variantId, userId, userEmail } = req.body || {};

  // Ensure we have what we need
  if (!variantId || !userId) {
    return res.status(400).json({ error: 'Missing variantId or userId' });
  }

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID; // 251789

  try {
    const lemonRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: userEmail || undefined,
              custom: {
                user_id: userId.toString(),
              },
            },
            product_options: {
              redirect_url: 'https://www.aivideonarrator.com/generator?payment=success',
              enabled_variants: [parseInt(variantId, 10)],
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: storeId?.toString() },
            },
            variant: {
              data: { type: 'variants', id: variantId.toString() },
            },
          },
        },
      }),
    });

    const data = await lemonRes.json();

    if (!lemonRes.ok) {
      console.error('🍋 Lemon Squeezy API Error Details:', JSON.stringify(data, null, 2));
      return res.status(lemonRes.status).json({ error: 'Lemon Squeezy error', details: data });
    }

    // Success! Return the checkout URL
    return res.status(200).json({ url: data.data.attributes.url });

  } catch (error: any) {
    console.error('💥 Server Error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
