// api/checkout.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { variantId, userId, userEmail } = req.body;

  if (!variantId || !userId) {
    return res.status(400).json({ error: 'Missing variantId or userId' });
  }

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            store_id: Number(process.env.LEMON_SQUEEZY_STORE_ID),
            variant_id: Number(variantId),
            checkout_data: {
              email: userEmail || null,
              custom: {
                user_id: userId,
              },
            },
            product_options: {
              redirect_url: 'https://aivideonarrator.com/pricing?success=true',
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Lemon Squeezy error:', data);
      return res.status(500).json({ error: 'Failed to create checkout' });
    }

    res.status(200).json({ url: data.data.attributes.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Important: Parse JSON body
export const config = {
  api: {
    bodyParser: true,
  },
};
