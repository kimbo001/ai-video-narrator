
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product_permalink, license_key } = req.body;

  if (!product_permalink || !license_key) {
    return res.status(400).json({ error: 'Missing parameters: product_permalink or license_key' });
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
      // Return the specific message from Gumroad if available
      const errorMessage = data.message || 'Invalid or refunded license';
      return res.status(400).json({ success: false, error: errorMessage, gumroad_response: data });
    }
  } catch (error) {
    console.error('Gumroad Verification Error:', error);
    return res.status(500).json({ error: 'Internal server error during verification' });
  }
}
