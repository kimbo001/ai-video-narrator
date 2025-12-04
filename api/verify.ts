
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product_permalink, license_key } = req.body;

  if (!product_permalink || !license_key) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_permalink,
        license_key,
      }),
    });

    const data = await response.json();

    if (data.success && !data.purchase.refunded && !data.purchase.chargebacked) {
      return res.status(200).json({ success: true, purchase: data.purchase });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid or refunded license' });
    }
  } catch (error) {
    console.error('Gumroad Verification Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
