export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const clerkUserId = url.searchParams.get('clerkUserId');

  if (!clerkUserId || clerkUserId === 'undefined' || clerkUserId === 'null') {
    return new Response(JSON.stringify({ error: 'Missing or invalid clerkUserId' }), { status: 400 });
  }

  try {
    // Check if a connection exists for this user in gtm_connections
    const result = await env.DB.prepare(
      'SELECT id FROM gtm_connections WHERE user_id = ? LIMIT 1'
    ).bind(clerkUserId).first();

    return new Response(JSON.stringify({ hasAuth: !!result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
