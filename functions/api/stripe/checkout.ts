import Stripe from 'stripe';
import { verifyClerkAuth } from '../_security';

export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const auth = await verifyClerkAuth(request, env);
    if (!auth || !auth.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const clerkUserId = auth.userId;

    if (!env.STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Stripe checkout is disabled' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body: any = await request.json().catch(() => ({}));
    const tier = body.tier === 'custom' ? 'custom' : 'pro';
    const containers = body.containers;

    const dbResult: any = await env.DB.prepare('SELECT email, stripe_customer_id FROM users WHERE id = ?')
      .bind(clerkUserId)
      .first();
    let customerId = dbResult?.stripe_customer_id;

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' as any });

    if (!customerId && dbResult?.email && dbResult.email !== 'unknown@example.com') {
      const customer = await stripe.customers.create({ email: dbResult.email, metadata: { clerkUserId } });
      customerId = customer.id;
      await env.DB.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').bind(customerId, clerkUserId).run();
    }

    const quantity = tier === 'custom' ? Math.max(10, Math.min(100, parseInt(containers, 10) || 10)) : 10;
    const baseCustomPrice = Math.max(149, Math.ceil(quantity * 14.9));
    const hasDiscount = quantity >= 15;
    const customPrice = hasDiscount ? Math.floor(baseCustomPrice * 0.9) : baseCustomPrice;

    const unitAmount = tier === 'pro' ? 14900 : customPrice * 100;
    const productName = tier === 'pro' ? 'GTMObserver Pro Plan' : 'GTMObserver Custom Plan';
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
      success_url: `${new URL(request.url).origin}/onboarding?checkout=success`,
      cancel_url: `${new URL(request.url).origin}/billing?checkout=cancelled`,
      metadata: { clerkUserId, tier }
    };

    const session = await stripe.checkout.sessions.create(sessionData);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
