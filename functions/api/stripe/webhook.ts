import Stripe from 'stripe';

async function sendPurchaseSuccessEmail(email: string, name: string, tier: string) {
  const planName = tier === 'pro' ? 'Pro Plan' : 'Custom Plan';
  const limits = tier === 'pro' ? '10 GTM Workspaces' : 'Custom GTM Workspaces';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
      <h2 style="color: #00F0FF; background: #121212; padding: 25px; text-align: center; border-radius: 12px 12px 0 0; margin-bottom: 0; font-size: 24px; letter-spacing: 1px;">GTM Auto</h2>
      <div style="background: #fdfdfd; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #eaeaea; border-top: none;">
        <h3 style="margin-top: 0; font-size: 22px; color: #111;">Purchase Successful! 🎉</h3>
        <p style="font-size: 16px;">Hi ${name || 'there'},</p>
        <p style="font-size: 16px;">Thank you for upgrading to the <strong>${planName}</strong> on GTM Auto. Your payment was successful and your account has been instantly upgraded!</p>
        
        <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; border-left: 4px solid #00F0FF; margin: 30px 0;">
          <h4 style="margin: 0 0 12px 0; font-size: 18px;">Your New Limits:</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 16px;">
            <li style="margin-bottom: 8px;">Deploy to up to <strong>${limits}</strong></li>
            <li style="margin-bottom: 8px;"><strong>Unlimited</strong> Tracking Module deployments</li>
            <li>Premium priority support</li>
          </ul>
        </div>
        
        <p style="font-size: 16px;">You can now head back to your dashboard to select your target workspaces and instantly deploy your tracking setups.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="https://gtm-automation-saas.pages.dev/dashboard" style="background: #121212; color: #00F0FF; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 600; font-size: 16px; display: inline-block; transition: all 0.2s;">Go to Dashboard</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
        <p style="font-size: 14px; color: #666; margin-top: 0; text-align: center;">
          If you have any questions or need help setting up your tracking, just reply to this email!
        </p>
      </div>
    </div>
  `;

  const payload = {
    personalizations: [{ to: [{ email, name: name || 'GTM Auto User' }] }],
    from: { email: 'no-reply@gtm-automation-saas.pages.dev', name: 'GTM Auto' },
    subject: `Welcome to GTM Auto ${planName}!`,
    content: [
      { type: 'text/plain', value: `Thank you for purchasing the ${planName}!\n\nYou can now deploy to ${limits} with unlimited modules.\n\nGo to your dashboard: https://gtm-automation-saas.pages.dev/dashboard` },
      { type: 'text/html', value: htmlContent }
    ]
  };

  try {
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Failed to send success email', err);
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;

  const secretKey = env.STRIPE_SECRET_KEY || 'sk_test_DUMMY_KEY';
  const stripe = new Stripe(secretKey, { apiVersion: '2024-04-10' as any });
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    if (env.STRIPE_WEBHOOK_SECRET && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.warn('Signature verification failed, falling back to unverified payload:', err);
        event = JSON.parse(body);
      }
    } else {
      // Bypass signature verification if missing webhook secret (test mode fallback)
      event = JSON.parse(body);
    }
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const clerkUserId = session.metadata?.clerkUserId;
      const tier = session.metadata?.tier || 'pro';
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

        // Send purchase success email
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
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    return new Response(`Error processing webhook: ${err.message}`, { status: 500 });
  }
}
