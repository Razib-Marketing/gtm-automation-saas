async function sendPurchaseSuccessEmail(env: any, email: string, name: string, tier: string) {
  const planName = tier === 'custom' ? 'Custom Plan' : 'Pro Plan';
  const limits = tier === 'custom' ? 'Custom Workspaces & Active GA4 Monitors' : '10 GTM Workspaces & 10 GA4 Observer Monitors';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
      <div style="max-width: 600px; margin: 30px auto; background-color: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #111827 0%, #1e1b4b 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #1f2937;">
          <h2 style="margin: 0; color: #00F0FF; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">GTMObserver</h2>
          <p style="margin: 6px 0 0 0; color: #9ca3af; font-size: 14px;">Automated GTM Deployment & GA4 Observer Intelligence</p>
        </div>
        <div style="padding: 32px 28px;">
          <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px; padding: 4px 14px; margin-bottom: 16px;">
            <span style="color: #34d399; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">✓ Payment Confirmed</span>
          </div>
          <h3 style="margin-top: 0; font-size: 22px; color: #ffffff; font-weight: 700;">Welcome to ${planName}! 🎉</h3>
          <p style="font-size: 15px; color: #d1d5db; line-height: 1.6;">Hi ${name || 'there'},</p>
          <p style="font-size: 15px; color: #d1d5db; line-height: 1.6;">Thank you for your payment via Polar.sh! Your account has been upgraded instantly to <strong>${planName}</strong>.</p>
          
          <div style="background-color: #1f2937; padding: 22px; border-radius: 12px; border-left: 4px solid #00F0FF; margin: 26px 0;">
            <h4 style="margin: 0 0 12px 0; font-size: 16px; color: #f3f4f6;">Your Unlocked Privileges:</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #e5e7eb; line-height: 1.8;">
              <li><strong>${limits}</strong></li>
              <li><strong>Unlimited</strong> Tracking Recipe Deployments</li>
              <li>Dual Alert History (Automated & Manual Reports)</li>
              <li>Advanced Compound Anomaly Rules (AND / OR)</li>
              <li>Multi-Email Incident Notifications</li>
              <li>Priority 24/7 Processing Queue</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://app.gtmobserver.com/dashboard" style="background: linear-gradient(135deg, #00F0FF 0%, #4F46E5 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(0, 240, 255, 0.35);">Open Dashboard</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #1f2937; margin: 28px 0;" />
          <p style="font-size: 13px; color: #9ca3af; margin: 0; text-align: center; line-height: 1.5;">
            Questions or need custom setup assistance? Reply directly to this email and our engineering team will assist you.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const resendApiKey = env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      let senderEmail = 'onboarding@resend.dev';
      try {
        const domRes = await fetch('https://api.resend.com/domains', {
          headers: { 'Authorization': `Bearer ${resendApiKey}` }
        });
        if (domRes.ok) {
          const domData: any = await domRes.json();
          const verified = domData.data?.find((d: any) => d.status === 'verified');
          if (verified) senderEmail = `billing@${verified.name}`;
        }
      } catch (_) {}

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `GTMObserver <${senderEmail}>`,
          to: [email],
          subject: `Payment Confirmed: Welcome to GTMObserver ${planName}!`,
          html: htmlContent
        })
      });
      return;
    } catch (err) {
      console.error('Failed to send success email via Resend:', err);
    }
  }

  // Fallback to MailChannels
  try {
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email, name: name || 'GTMObserver User' }] }],
        from: { email: 'no-reply@gtm-automation-saas.ovi-e69.workers.dev', name: 'GTMObserver' },
        subject: `Payment Confirmed: Welcome to GTMObserver ${planName}!`,
        content: [{ type: 'text/html', value: htmlContent }]
      })
    });
  } catch (err) {
    console.error('Failed to send success email via MailChannels:', err);
  }
}

async function verifyPolarSignature(
  rawBody: string,
  headers: Headers,
  secret: string
): Promise<boolean> {
  const webhookId = headers.get('webhook-id');
  const webhookTimestamp = headers.get('webhook-timestamp');
  const webhookSignature = headers.get('webhook-signature');

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return false;
  }

  // Prevent replay attacks (5 min tolerance)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(webhookTimestamp, 10);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return false;
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;

  let keyBytes: Uint8Array;
  try {
    const binaryStr = atob(rawSecret);
    keyBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      keyBytes[i] = binaryStr.charCodeAt(i);
    }
  } catch {
    keyBytes = new TextEncoder().encode(rawSecret);
  }

  try {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      new TextEncoder().encode(signedContent)
    );

    let binary = '';
    const bytes = new Uint8Array(signatureBuffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const computedSig = btoa(binary);

    const candidateSigs = webhookSignature.split(' ');
    for (const item of candidateSigs) {
      const [v, sig] = item.split(',');
      if (v === 'v1' && sig === computedSig) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('Crypto verification error:', err);
    return false;
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;

  const rawBody = await request.text();
  const webhookSecret = env.POLAR_WEBHOOK_SECRET;

  if (webhookSecret) {
    const isValid = await verifyPolarSignature(rawBody, request.headers, webhookSecret);
    if (!isValid) {
      console.warn('Polar webhook signature verification failed');
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } else {
    console.warn('POLAR_WEBHOOK_SECRET not configured, processing webhook without signature verification (test mode)');
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Malformed JSON payload' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const eventType = event.type || '';
  const data = event.data?.object || event.data || {};

  // Safely ensure DB columns exist
  try {
    await env.DB.prepare('ALTER TABLE users ADD COLUMN polar_subscription_id TEXT').run();
  } catch (_) {}
  try {
    await env.DB.prepare('ALTER TABLE users ADD COLUMN polar_customer_id TEXT').run();
  } catch (_) {}

  try {
    if (eventType === 'order.created' || eventType === 'subscription.created' || eventType === 'subscription.active') {
      const metadata = data.metadata || {};
      const clerkUserId = metadata.clerkUserId;
      const tier = (metadata.tier === 'custom' ? 'custom' : 'pro') as 'pro' | 'custom';
      
      const customer = data.customer || {};
      const email = customer.email || data.customer_email || metadata.email || 'unknown@example.com';
      const name = customer.name || data.customer_name || '';
      const customerId = customer.id || data.customer_id || null;
      const subscriptionId = data.id || data.subscription_id || null;

      if (clerkUserId) {
        await env.DB.prepare(`
          INSERT INTO users (id, email, subscription_tier, stripe_subscription_id, polar_subscription_id, polar_customer_id)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET 
            subscription_tier = excluded.subscription_tier,
            polar_subscription_id = COALESCE(excluded.polar_subscription_id, users.polar_subscription_id),
            polar_customer_id = COALESCE(excluded.polar_customer_id, users.polar_customer_id),
            stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, users.stripe_subscription_id)
        `).bind(clerkUserId, email, tier, subscriptionId, subscriptionId, customerId).run();

        if (email && email !== 'unknown@example.com') {
          context.waitUntil(sendPurchaseSuccessEmail(env, email, name, tier));
        }
      } else if (email && email !== 'unknown@example.com') {
        // Fallback: match by email if clerkUserId wasn't passed
        await env.DB.prepare(`
          UPDATE users 
          SET subscription_tier = ?, 
              polar_subscription_id = ?, 
              polar_customer_id = ?
          WHERE email = ?
        `).bind(tier, subscriptionId, customerId, email).run();

        context.waitUntil(sendPurchaseSuccessEmail(env, email, name, tier));
      }
    } else if (eventType === 'subscription.canceled' || eventType === 'subscription.revoked') {
      const subscriptionId = data.id;
      const metadata = data.metadata || {};
      const clerkUserId = metadata.clerkUserId;

      if (clerkUserId) {
        await env.DB.prepare("UPDATE users SET subscription_tier = 'free' WHERE id = ?").bind(clerkUserId).run();
      } else if (subscriptionId) {
        await env.DB.prepare(`
          UPDATE users 
          SET subscription_tier = 'free' 
          WHERE polar_subscription_id = ? OR stripe_subscription_id = ?
        `).bind(subscriptionId, subscriptionId).run();
      }
    } else if (eventType === 'subscription.updated') {
      const status = data.status;
      const subscriptionId = data.id;
      const metadata = data.metadata || {};
      const clerkUserId = metadata.clerkUserId;
      const tier = metadata.tier === 'custom' ? 'custom' : 'pro';

      if (status === 'active' || status === 'trialing') {
        if (clerkUserId) {
          await env.DB.prepare("UPDATE users SET subscription_tier = ? WHERE id = ?").bind(tier, clerkUserId).run();
        } else if (subscriptionId) {
          await env.DB.prepare(`
            UPDATE users 
            SET subscription_tier = ? 
            WHERE polar_subscription_id = ? OR stripe_subscription_id = ?
          `).bind(tier, subscriptionId, subscriptionId).run();
        }
      } else if (status === 'canceled' || status === 'past_due' || status === 'unpaid') {
        if (clerkUserId) {
          await env.DB.prepare("UPDATE users SET subscription_tier = 'free' WHERE id = ?").bind(clerkUserId).run();
        } else if (subscriptionId) {
          await env.DB.prepare(`
            UPDATE users 
            SET subscription_tier = 'free' 
            WHERE polar_subscription_id = ? OR stripe_subscription_id = ?
          `).bind(subscriptionId, subscriptionId).run();
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error processing Polar webhook:', err);
    return new Response(JSON.stringify({ error: `Error processing webhook: ${err.message}` }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
