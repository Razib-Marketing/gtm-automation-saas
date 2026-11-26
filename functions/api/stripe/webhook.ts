import Stripe from 'stripe';
import { escapeHtml } from '../_security';

async function sendPurchaseSuccessEmail(email: string, name: string, tier: string) {
  const planName = tier === 'pro' ? 'Pro Plan' : 'Custom Plan';
  const limits = tier === 'pro' ? '10 GTM Workspaces' : 'Custom GTM Workspaces';
  const safeName = escapeHtml(name || 'there');

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
      <h2 style="color: #00F0FF; background: #121212; padding: 25px; text-align: center; border-radius: 12px 12px 0 0; margin-bottom: 0; font-size: 24px; letter-spacing: 1px;">GTMObserver</h2>
      <div style="background: #fdfdfd; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #eaeaea; border-top: none;">
        <h3 style="margin-top: 0; font-size: 22px; color: #111;">Purchase Successful!</h3>
        <p style="font-size: 16px;">Hi ${safeName},</p>
        <p style="font-size: 16px;">Thank you for upgrading to the <strong>${escapeHtml(planName)}</strong> on GTMObserver. Your payment was successful and your account has been instantly upgraded!</p>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; border-left: 4px solid #00F0FF; margin: 30px 0;">
          <h4 style="margin: 0 0 12px 0; font-size: 18px;">Your New Limits:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 16px;">
            <li style="margin-bottom: 8px;">Deploy to up to <strong>${escapeHtml(limits)}</strong></li>
            <li style="margin-bottom: 8px;"><strong>Unlimited</strong> Tracking Module deployments</li>
            <li>Premium priority support</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 40px 0;">
          <a href="https://app.gtmobserver.com/organization" style="background: #121212; color: #00F0FF; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 600; font-size: 16px; display: inline-block;">Open Dashboard</a>
        </div>
      </div>
    </div>
  `;

  try {
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email, name: name || 'GTMObserver User' }] }],
        from: { email: 'no-reply@gtmobserver.com', name: 'GTMObserver' },
        subject: `Welcome to GTMObserver ${planName}!`,
        content: [
          { type: 'text/plain', value: `Thank you for purchasing the ${planName}!` },
          { type: 'text/html', value: htmlContent }
        ]
      })
    });
  } catch (err) {
    console.error('Failed to send success email', err);
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;

  // Fail closed: Stripe webhook MUST have STRIPE_WEBHOOK_SECRET and valid signature
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Stripe webhook secret not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing Stripe signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const secretKey = env.STRIPE_SECRET_KEY || 'sk_disabled';
  const stripe = new Stripe(secretKey, { apiVersion: '2024-04-10' as any });
  const body = await request.text();

  let event: any;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.warn('Stripe webhook signature verification failed:', err?.message || err);
    return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const clerkUserId = session.metadata?.clerkUserId;
      const tier = session.metadata?.tier === 'custom' ? 'custom' : 'pro';
      const subscriptionId = session.subscription;

      if (clerkUserId && subscriptionId) {
        const email = session.customer_details?.email || 'unknown@example.com';
        const name = session.customer_details?.name || '';
        await env.DB.prepare(`
          INSERT INTO users (id, email, subscription_tier, stripe_subscription_id)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET 
            subscription_tier = excluded.subscription_tier,
            stripe_subscription_id = excluded.stripe_subscription_id
        `).bind(clerkUserId, email, tier, subscriptionId).run();

        if (email !== 'unknown@example.com') {
          context.waitUntil(sendPurchaseSuccessEmail(email, name, tier));
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      await env.DB.prepare(
        "UPDATE users SET subscription_tier = 'free', stripe_subscription_id = NULL WHERE stripe_subscription_id = ?"
      ).bind(subscription.id).run();
    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any;
      const status = subscription.status;
      if (status !== 'active' && status !== 'trialing') {
        await env.DB.prepare(
          "UPDATE users SET subscription_tier = 'free' WHERE stripe_subscription_id = ?"
        ).bind(subscription.id).run();
      }
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error processing Stripe webhook:', err);
    return new Response(JSON.stringify({ error: 'Error processing webhook' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
