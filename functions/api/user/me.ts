export async function onRequestGet(context: any) {
  const { request, env } = context;

  const clerkUserId = new URL(request.url).searchParams.get('clerkUserId');
  if (!clerkUserId || clerkUserId === 'undefined' || clerkUserId === 'null') {
    return new Response(JSON.stringify({ error: 'Missing or invalid clerkUserId' }), { status: 400 });
  }

  try {
    let dbResult = await env.DB.prepare(
      'SELECT subscription_tier, account_deployment_count FROM users WHERE id = ?'
    ).bind(clerkUserId).first();

    if (!dbResult) {
       // Create user if not exists
       const email = new URL(request.url).searchParams.get('email') || 'unknown@example.com';
       await env.DB.prepare(
         "INSERT INTO users (id, email, subscription_tier) VALUES (?, ?, 'free')"
       ).bind(clerkUserId, email).run();
       dbResult = { subscription_tier: 'free', account_deployment_count: 0 };
    }

    if (dbResult) {
      // Temporary backdoor for specific admin user
      const email = new URL(request.url).searchParams.get('email') || '';
      if (email === 'ovi@razibmarketing.net' || email === 'ovi@razibmarekting.net' || email === 'support@cogwheelmarketing.com') {
        dbResult.subscription_tier = 'custom';
      }
    }

    return new Response(JSON.stringify(dbResult), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
