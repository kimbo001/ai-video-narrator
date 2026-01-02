// api/checkout.ts
export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { variantId, userId, userEmail } = await req.json();

    if (!variantId || !userId || !userEmail) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
    }

    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      console.error("Missing Env Vars: API_KEY or STORE_ID");
      return new Response(JSON.stringify({ error: "Server config error" }), { status: 500 });
    }

    const payload = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: userEmail,
            custom: { userId: userId }
          }
        },
        relationships: {
          store: { data: { type: "stores", id: storeId.toString() } },
          variant: { data: { type: "variants", id: variantId.toString() } }
        }
      }
    };

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    // --- DEBUGGING BLOCK ---
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Lemon API Error Body:", errorText);
        return new Response(JSON.stringify({ error: `Lemon API Failed: ${response.status}`, details: errorText }), { status: response.status });
    }
    // -----------------------

    const result = await response.json();
    return new Response(JSON.stringify({ url: result.data.attributes.url }), { status: 200 });

  } catch (error: any) {
    console.error("Checkout Handler Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
