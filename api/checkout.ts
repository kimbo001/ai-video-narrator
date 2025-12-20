// api/checkout.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { variantId, userId } = req.body;

  // Validate input
  if (!variantId || !userId) {
    return res.status(400).json({ error: 'Missing variantId or userId' });
  }

  // Get environment variables
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    console.error('❌ Missing Lemon Squeezy env vars');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    // Create checkout via Lemon Squeezy API
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
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
            store_id: parseInt(storeId),
            variant_id: parseInt(variantId),
            checkout_ {
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

    const data = await response.json();

    if (!response.ok) {
      console.error('Lemon API error:', data);
      return res.status(response.status).json({ error: 'Failed to create checkout' });
    }

    // Return the checkout URL to frontend
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
