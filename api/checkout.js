// api/checkout.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed');
    return;
  }

  const { variantId, userId, userEmail } = req.body;

  if (!variantId || !userId) {
    return res.status(400).json({ error: 'Missing data' });
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
              custom: { user_id: userId },
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
      console.error(data);
      return res.status(500).json({ error: 'Checkout failed' });
    }

    res.status(200).json({ url: data.data.attributes.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// For Vercel
export const config = {
  api: {
    bodyParser: true,
  },
};
