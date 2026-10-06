import Stripe from 'stripe';

export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    let clerkUserId = null;
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadString = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      clerkUserId = JSON.parse(payloadString).sub;
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    const { tier, containers } = await request.json();

    // Look up user in DB
    const dbResult = await env.DB.prepare('SELECT email, stripe_customer_id FROM users WHERE id = ?').bind(clerkUserId).first();
    let customerId = dbResult?.stripe_customer_id;

    const secretKey = env.STRIPE_SECRET_KEY || 'sk_test_DUMMY_KEY';
    const stripe = new Stripe(secretKey, { apiVersion: '2024-04-10' as any });

    if (!customerId && dbResult?.email) {
      const customer = await stripe.customers.create({ email: dbResult.email, metadata: { clerkUserId } });
      customerId = customer.id;
      await env.DB.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').bind(customerId, clerkUserId).run();
    }

    const quantity = tier === 'custom' ? parseInt(containers) || 10 : 1;
    
    // Exact matching math from frontend:
    const baseCustomPrice = Math.max(149, Math.ceil(quantity * 14.9)); // 10 GTM Accounts = $149
    const hasDiscount = quantity >= 15;
    const customPrice = hasDiscount ? Math.floor(baseCustomPrice * 0.9) : baseCustomPrice;

    const unitAmount = tier === 'pro' ? 14900 : customPrice * 100;
    const productName = tier === 'pro' ? 'GTMAuto Pro Plan' : 'GTMAuto Custom Plan';
    const productDesc = tier === 'pro' ? 'Up to 10 GTM Workspaces' : `Up to ${quantity} GTM Workspaces${hasDiscount ? ' (10% Volume Discount)' : ''}`;

    const sessionData: any = {
      customer: customerId || undefined,
      payment_method_types: ['card'],
      line_items: [{ 
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
            description: productDesc,
          },
          unit_amount: unitAmount,
          recurring: { interval: 'month' }
        },
        quantity: 1 
      }],
      mode: 'subscription',
      success_url: `${new URL(request.url).origin}/dashboard?checkout=success`,
      cancel_url: `${new URL(request.url).origin}/pricing?checkout=cancelled`,
      metadata: { clerkUserId, tier }
    };

    const session = await stripe.checkout.sessions.create(sessionData);

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
