import { verifyClerkAuth } from '../_security';

export async function onRequest(context: any) {
  const { request, env } = context;

  const auth = await verifyClerkAuth(request, env);
  if (!auth || !auth.userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const result: any = await env.DB.prepare(
      'SELECT id, encrypted_refresh_token FROM gtm_connections WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    )
      .bind(auth.userId)
      .first();

    const hasAuth = Boolean(
      result &&
        result.encrypted_refresh_token &&
        result.encrypted_refresh_token !== 'no_refresh_token_provided'
    );

    return new Response(JSON.stringify({ hasAuth }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('GET /api/auth/status error:', error);
    return new Response(JSON.stringify({ error: 'Failed to check Google connection status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
