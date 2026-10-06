export async function onRequestPost(context: any) {
  const { request, env } = context;

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

  try {
    const { accountId } = await request.json();
    if (!accountId) return new Response('Missing accountId', { status: 400 });

    // Ensure connection exists or just use a dedicated tracking table. We'll update the user's count directly for simplicity if it's a new account.
    // Let's check if this user already deployed to this account via deployed_recipes and gtm_connections
    const result = await env.DB.prepare(`
      SELECT count(gc.id) as cnt FROM gtm_connections gc
      JOIN deployed_recipes dr ON dr.connection_id = gc.id
      WHERE gc.user_id = ? AND gc.account_id = ? AND dr.status = 'success'
    `).bind(clerkUserId, accountId).first();

    if (result && result.cnt === 0) {
      // It's a new account deployment
      await env.DB.prepare(
        'UPDATE users SET account_deployment_count = account_deployment_count + 1 WHERE id = ?'
      ).bind(clerkUserId).run();
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
