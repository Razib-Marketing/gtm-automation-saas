export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authentication token' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const token = authHeader.split(' ')[1];
    let clerkUserId: string | null = null;
    let tokenEmail: string | null = null;
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadString = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const parsed = JSON.parse(payloadString);
      clerkUserId = parsed.sub;
      tokenEmail = parsed.email || parsed.email_address || null;
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!clerkUserId) {
      return new Response(JSON.stringify({ error: 'User identifier not found in token' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json().catch(() => ({}));
    const tier = (body.tier === 'custom' ? 'custom' : 'pro') as 'pro' | 'custom';
    const containers = tier === 'custom' ? parseInt(body.containers) || 10 : 10;

    // Fetch user from DB to obtain email if not in token
    let userEmail = tokenEmail;
    try {
      const dbResult = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(clerkUserId).first();
      if (dbResult?.email) {
        userEmail = dbResult.email;
      }
    } catch (_) {}

    const origin = new URL(request.url).origin;
    const successUrl = `${origin}/dashboard?checkout=success`;

    // 1. Check for manual/direct checkout URL override
    const directUrl = tier === 'custom' 
      ? (env.POLAR_CHECKOUT_URL_CUSTOM || env.POLAR_CHECKOUT_URL_PRO)
      : env.POLAR_CHECKOUT_URL_PRO;

    if (directUrl && !env.POLAR_ACCESS_TOKEN) {
      // Append query parameters if possible
      const sep = directUrl.includes('?') ? '&' : '?';
      const redirectUrl = `${directUrl}${sep}customer_email=${encodeURIComponent(userEmail || '')}&metadata[clerkUserId]=${encodeURIComponent(clerkUserId)}&metadata[tier]=${tier}`;
      return new Response(JSON.stringify({ url: redirectUrl }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const polarToken = env.POLAR_ACCESS_TOKEN;
    if (!polarToken) {
      return new Response(JSON.stringify({ 
        error: 'Polar payment processing is not configured yet. Please configure POLAR_ACCESS_TOKEN and POLAR_PRODUCT_PRO_ID in your Cloudflare environment variables.',
        requiresConfig: true
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const polarServer = (env.POLAR_SERVER || 'production').toLowerCase();
    const polarApiBase = polarServer === 'sandbox' 
      ? 'https://sandbox-api.polar.sh/v1' 
      : 'https://api.polar.sh/v1';

    // 2. Resolve Product ID
    let productId = tier === 'custom' 
      ? (env.POLAR_PRODUCT_CUSTOM_ID || env.POLAR_PRODUCT_PRO_ID)
      : env.POLAR_PRODUCT_PRO_ID;

    // Auto-discovery fallback if specific product ID wasn't provided in env
    if (!productId) {
      try {
        const prodRes = await fetch(`${polarApiBase}/products/`, {
          headers: {
            'Authorization': `Bearer ${polarToken}`,
            'Accept': 'application/json'
          }
        });
        if (prodRes.ok) {
          const prodData: any = await prodRes.json();
          const items = Array.isArray(prodData.items) ? prodData.items : (Array.isArray(prodData) ? prodData : []);
          
          if (tier === 'custom') {
            const matchCustom = items.find((p: any) => p.name?.toLowerCase().includes('custom'));
            if (matchCustom) productId = matchCustom.id;
          }
          
          if (!productId) {
            const matchPro = items.find((p: any) => p.name?.toLowerCase().includes('pro'));
            if (matchPro) {
              productId = matchPro.id;
            } else if (items.length > 0) {
              productId = items[0].id; // Fallback to first available product
            }
          }
        }
      } catch (err) {
        console.warn('Failed to auto-discover Polar products:', err);
      }
    }

    if (!productId) {
      return new Response(JSON.stringify({ 
        error: 'No Polar product found. Please configure POLAR_PRODUCT_PRO_ID in your Cloudflare environment variables or create a product in your Polar dashboard.',
        requiresConfig: true
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Create Checkout Session via Polar API
    const checkoutBody: any = {
      products: [productId],
      success_url: successUrl,
      metadata: {
        clerkUserId,
        tier,
        containers: String(containers)
      }
    };

    if (userEmail) {
      checkoutBody.customer_email = userEmail;
    }

    const checkoutRes = await fetch(`${polarApiBase}/checkouts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${polarToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(checkoutBody)
    });

    if (!checkoutRes.ok) {
      const errText = await checkoutRes.text();
      console.error('Polar checkout creation failed:', checkoutRes.status, errText);
      let errMsg = 'Failed to create checkout session with Polar';
      try {
        const parsedErr = JSON.parse(errText);
        errMsg = parsedErr.detail || parsedErr.message || parsedErr.error || errMsg;
      } catch (_) {}
      return new Response(JSON.stringify({ error: errMsg }), { 
        status: checkoutRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessionData: any = await checkoutRes.json();
    const checkoutUrl = sessionData.url || sessionData.checkout_url;

    if (!checkoutUrl) {
      return new Response(JSON.stringify({ error: 'Polar checkout did not return a valid checkout URL' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ url: checkoutUrl }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
