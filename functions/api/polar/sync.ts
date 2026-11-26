import { verifyClerkAuth } from '../_security';
import { ensureUsersSchema, resolveUserEmail } from '../ga4/_shared';
import { getPolarApiBase, resolveTierFromProduct, resolveWorkspaceLimit } from './_shared';

export async function onRequestPost(context: any) {
  const { request, env } = context;

  const auth = await verifyClerkAuth(request, env);
  if (!auth || !auth.userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const polarToken = env.POLAR_ACCESS_TOKEN;
  if (!polarToken) {
    return new Response(JSON.stringify({ error: 'Polar is not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body: any = await request.json().catch(() => ({}));
    const checkoutId = typeof body?.checkoutId === 'string' ? body.checkoutId.trim() : '';

    if (!checkoutId || !/^[a-zA-Z0-9_-]{8,100}$/.test(checkoutId)) {
      return new Response(JSON.stringify({ error: 'Invalid checkoutId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const polarApiBase = getPolarApiBase(env);
    const res = await fetch(`${polarApiBase}/checkouts/${encodeURIComponent(checkoutId)}`, {
      headers: {
        Authorization: `Bearer ${polarToken}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Unable to verify checkout session with Polar' }), {
        status: res.status === 404 ? 404 : 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const checkout: any = await res.json();
    const status = String(checkout?.status || '').toLowerCase();
    if (status !== 'succeeded' && status !== 'confirmed') {
      return new Response(
        JSON.stringify({ synced: false, status, message: 'Checkout payment not finalized yet.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const metadata = checkout?.metadata || {};
    const dbEmail = await resolveUserEmail(env.DB, auth.userId);
    const callerEmail = (auth.email || dbEmail || '').toLowerCase().trim();
    const checkoutEmail = String(checkout?.customer_email || '').toLowerCase().trim();

    const ownerMatch =
      metadata?.clerkUserId === auth.userId ||
      checkout?.external_customer_id === auth.userId ||
      (callerEmail && checkoutEmail && callerEmail === checkoutEmail);

    if (!ownerMatch) {
      return new Response(JSON.stringify({ error: 'Checkout session belongs to another user' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const productId = checkout?.product_id || checkout?.product?.id || metadata?.productId || null;
    const tier = resolveTierFromProduct(env, productId, metadata?.tier);
    const workspaceLimit = resolveWorkspaceLimit(tier, metadata?.containers);
    const polarCustomerId = checkout?.customer_id || null;
    const polarSubId = checkout?.subscription_id || null;
    const safeEmail = callerEmail || checkoutEmail || 'unknown@example.com';

    await ensureUsersSchema(env.DB);

    await env.DB.prepare(
      `INSERT INTO users (id, email, subscription_tier, workspace_limit, polar_subscription_id, polar_customer_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         subscription_tier = excluded.subscription_tier,
         workspace_limit = excluded.workspace_limit,
         polar_subscription_id = COALESCE(excluded.polar_subscription_id, users.polar_subscription_id),
         polar_customer_id = COALESCE(excluded.polar_customer_id, users.polar_customer_id),
         updated_at = CURRENT_TIMESTAMP`
    )
      .bind(auth.userId, safeEmail, tier, workspaceLimit, polarSubId, polarCustomerId)
      .run();

    return new Response(
      JSON.stringify({
        synced: true,
        tier,
        workspaceLimit
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('POST /api/polar/sync error:', err);
    return new Response(JSON.stringify({ error: 'Failed to sync Polar checkout' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
