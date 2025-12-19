import express from 'express';
import fetch from 'node-fetch'; // or use built-in fetch in Node 18+

const router = express.Router();

router.post('/checkout', async (req, res) => {
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
            store_id: parseInt(process.env.LEMON_SQUEEZY_STORE_ID),
            variant_id: parseInt(variantId),
            checkout_data: {
              email: userEmail || null,
              name: null, // optional
              custom: {
                user_id: userId, // This will be available in webhooks!
              },
            },
            product_options: {
              redirect_url: 'https://yourapp.com/pricing?success=true', // Back to pricing with success flag
            },
            // Optional: embed overlay (no redirect)
            // checkout_options: { embed: true, media: false },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(500).json({ error: 'Checkout creation failed' });
    }

    const checkoutUrl = data.data.attributes.url;
    res.json({ url: checkoutUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
