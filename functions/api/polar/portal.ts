import { verifyClerkAuth } from '../_security';
import { ensureUsersSchema } from '../ga4/_shared';
import { getPolarApiBase } from './_shared';

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
    return new Response(JSON.stringify({ error: 'Polar portal is not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    await ensureUsersSchema(env.DB);
    const userRow: any = await env.DB.prepare(
      'SELECT polar_customer_id FROM users WHERE id = ? LIMIT 1'
    )
      .bind(auth.userId)
      .first();

    const polarApiBase = getPolarApiBase(env);
    const bodyPayload = userRow?.polar_customer_id
      ? { customer_id: userRow.polar_customer_id }
      : { external_customer_id: auth.userId };

    const res = await fetch(`${polarApiBase}/customer-sessions/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${polarToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(bodyPayload)
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data?.customer_portal_url) {
      return new Response(
        JSON.stringify({
          error:
            data?.detail ||
            'No Polar billing customer profile found yet. Complete a checkout first or manage your plan in Billing.'
        }),
        { status: res.status === 404 || res.status === 422 ? 404 : 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ url: data.customer_portal_url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('POST /api/polar/portal error:', err);
    return new Response(JSON.stringify({ error: 'Failed to open Polar Customer Portal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
