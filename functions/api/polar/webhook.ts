import { escapeHtml, timingSafeEqualStr } from '../_security';
import { ensureUsersSchema } from '../ga4/_shared';
import { resolveTierFromProduct, resolveWorkspaceLimit } from './_shared';

async function sendPurchaseSuccessEmail(env: any, email: string, name: string, tier: string, limit: number) {
  const planName = tier === 'custom' ? 'Custom Scale Plan' : 'Pro Organization Plan';
  const limitsText =
    tier === 'custom'
      ? `Up to ${limit} Workspaces & Active GA4 Monitors`
      : 'Up to 10 Workspaces & Active GA4 Monitors';

  const safeName = escapeHtml(name || 'there');
  const safePlanName = escapeHtml(planName);
  const safeLimits = escapeHtml(limitsText);

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
          <p style="margin: 6px 0 0 0; color: #9ca3af; font-size: 14px;">Automated GTM Deployment &amp; GA4 Observer Intelligence</p>
        </div>
        <div style="padding: 32px 28px;">
          <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px; padding: 4px 14px; margin-bottom: 16px;">
            <span style="color: #34d399; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">✓ Payment Confirmed</span>
          </div>
          <h3 style="margin-top: 0; font-size: 22px; color: #ffffff; font-weight: 700;">Welcome to ${safePlanName}!</h3>
          <p style="font-size: 15px; color: #d1d5db; line-height: 1.6;">Hi ${safeName},</p>
          <p style="font-size: 15px; color: #d1d5db; line-height: 1.6;">Thank you for your payment via Polar.sh! Your account has been upgraded instantly to <strong>${safePlanName}</strong>.</p>
          
          <div style="background-color: #1f2937; padding: 22px; border-radius: 12px; border-left: 4px solid #00F0FF; margin: 26px 0;">
            <h4 style="margin: 0 0 12px 0; font-size: 16px; color: #f3f4f6;">Your Unlocked Privileges:</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #e5e7eb; line-height: 1.8;">
              <li><strong>${safeLimits}</strong></li>
              <li><strong>Unlimited</strong> Tracking Recipe Deployments</li>
              <li>Dual Alert History (Automated &amp; Manual Reports)</li>
              <li>Advanced Compound Anomaly Rules (AND / OR)</li>
              <li>Multi-Email Incident Notifications + PDF Exports</li>
              <li>Priority 24/7 Processing Queue</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://app.gtmobserver.com/organization" style="background: linear-gradient(135deg, #00F0FF 0%, #4F46E5 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block;">Open Dashboard</a>
          </div>
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
          headers: { Authorization: `Bearer ${resendApiKey}` }
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
          Authorization: `Bearer ${resendApiKey}`,
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
      console.error('Failed to send Polar success email via Resend:', err);
    }
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
      keyBytes as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      new TextEncoder().encode(signedContent) as unknown as BufferSource
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
      if (v === 'v1' && sig && timingSafeEqualStr(sig, computedSig)) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('Polar signature crypto error:', err);
    return false;
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;

  // Fail closed: require POLAR_WEBHOOK_SECRET and valid Standard Webhooks signature
  const webhookSecret = env.POLAR_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response(JSON.stringify({ error: 'POLAR_WEBHOOK_SECRET is not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const rawBody = await request.text();
  const isValid = await verifyPolarSignature(rawBody, request.headers, webhookSecret);
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Malformed JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const eventType = event.type || '';
  const data = event.data?.object || event.data || {};

  await ensureUsersSchema(env.DB);

  try {
    if (
      eventType === 'order.created' ||
      eventType === 'order.paid' ||
      eventType === 'subscription.created' ||
      eventType === 'subscription.active'
    ) {
      const metadata = data.metadata || {};
      const customer = data.customer || {};
      const clerkUserId =
        metadata.clerkUserId ||
        data.external_customer_id ||
        customer.external_id ||
        null;
      const productId = data.product_id || data.product?.id || metadata.productId || null;
      const tier = resolveTierFromProduct(env, productId, metadata.tier);
      const workspaceLimit = resolveWorkspaceLimit(tier, metadata.containers);

      const email = customer.email || data.customer_email || metadata.email || 'unknown@example.com';
      const name = customer.name || data.customer_name || '';
      const customerId = customer.id || data.customer_id || null;
      const subscriptionId = data.subscription_id || (eventType.startsWith('subscription.') ? data.id : null);

      if (clerkUserId) {
        await env.DB.prepare(`
          INSERT INTO users (id, email, subscription_tier, workspace_limit, stripe_subscription_id, polar_subscription_id, polar_customer_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET 
            subscription_tier = excluded.subscription_tier,
            workspace_limit = excluded.workspace_limit,
            polar_subscription_id = COALESCE(excluded.polar_subscription_id, users.polar_subscription_id),
            polar_customer_id = COALESCE(excluded.polar_customer_id, users.polar_customer_id),
            stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, users.stripe_subscription_id),
            updated_at = CURRENT_TIMESTAMP
        `).bind(clerkUserId, email, tier, workspaceLimit, subscriptionId, subscriptionId, customerId).run();

        if (email && email !== 'unknown@example.com') {
          context.waitUntil(sendPurchaseSuccessEmail(env, email, name, tier, workspaceLimit));
        }
      } else if (email && email !== 'unknown@example.com') {
        await env.DB.prepare(`
          UPDATE users 
          SET subscription_tier = ?,
              workspace_limit = ?,
              polar_subscription_id = COALESCE(?, polar_subscription_id),
              polar_customer_id = COALESCE(?, polar_customer_id),
              updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(email) = LOWER(?)
        `).bind(tier, workspaceLimit, subscriptionId, customerId, email).run();

        context.waitUntil(sendPurchaseSuccessEmail(env, email, name, tier, workspaceLimit));
      }
    } else if (eventType === 'subscription.canceled' || eventType === 'subscription.revoked') {
      const subscriptionId = data.id;
      const metadata = data.metadata || {};
      const customer = data.customer || {};
      const clerkUserId =
        metadata.clerkUserId ||
        data.external_customer_id ||
        customer.external_id ||
        null;

      if (clerkUserId) {
        await env.DB.prepare("UPDATE users SET subscription_tier = 'free', workspace_limit = 0 WHERE id = ?")
          .bind(clerkUserId)
          .run();
      } else if (subscriptionId) {
        await env.DB.prepare(`
          UPDATE users 
          SET subscription_tier = 'free', workspace_limit = 0
          WHERE polar_subscription_id = ? OR stripe_subscription_id = ?
        `).bind(subscriptionId, subscriptionId).run();
      }
    } else if (eventType === 'subscription.updated') {
      const status = String(data.status || '').toLowerCase();
      const subscriptionId = data.id;
      const metadata = data.metadata || {};
      const customer = data.customer || {};
      const clerkUserId =
        metadata.clerkUserId ||
        data.external_customer_id ||
        customer.external_id ||
        null;
      const productId = data.product_id || data.product?.id || metadata.productId || null;
      const tier = resolveTierFromProduct(env, productId, metadata.tier);
      const workspaceLimit = resolveWorkspaceLimit(tier, metadata.containers);

      if (status === 'active' || status === 'trialing') {
        if (clerkUserId) {
          await env.DB.prepare('UPDATE users SET subscription_tier = ?, workspace_limit = ? WHERE id = ?')
            .bind(tier, workspaceLimit, clerkUserId)
            .run();
        } else if (subscriptionId) {
          await env.DB.prepare(`
            UPDATE users 
            SET subscription_tier = ?, workspace_limit = ?
            WHERE polar_subscription_id = ? OR stripe_subscription_id = ?
          `).bind(tier, workspaceLimit, subscriptionId, subscriptionId).run();
        }
      } else if (status === 'canceled' || status === 'past_due' || status === 'unpaid' || status === 'revoked') {
        if (clerkUserId) {
          await env.DB.prepare("UPDATE users SET subscription_tier = 'free', workspace_limit = 0 WHERE id = ?")
            .bind(clerkUserId)
            .run();
        } else if (subscriptionId) {
          await env.DB.prepare(`
            UPDATE users 
            SET subscription_tier = 'free', workspace_limit = 0
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
    return new Response(JSON.stringify({ error: 'Error processing webhook' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
