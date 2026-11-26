import { isValidGtmAccountId, verifyClerkAuth } from '../_security';

export async function onRequestPost(context: any) {
  const { request, env } = context;

  const auth = await verifyClerkAuth(request, env);
  if (!auth || !auth.userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body: any = await request.json().catch(() => ({}));
    const accountId = typeof body?.accountId === 'string' ? body.accountId.trim() : String(body?.accountId || '');
    if (!isValidGtmAccountId(accountId)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid accountId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result: any = await env.DB.prepare(`
      SELECT count(gc.id) as cnt FROM gtm_connections gc
      JOIN deployed_recipes dr ON dr.connection_id = gc.id
      WHERE gc.user_id = ? AND gc.account_id = ? AND dr.status = 'success'
    `)
      .bind(auth.userId, accountId)
      .first();

    if (result && result.cnt === 0) {
      await env.DB.prepare(
        'UPDATE users SET account_deployment_count = COALESCE(account_deployment_count, 0) + 1 WHERE id = ?'
      )
        .bind(auth.userId)
        .run();
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('POST /api/user/track-deployment error:', err);
    return new Response(JSON.stringify({ error: 'Failed to track deployment' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
