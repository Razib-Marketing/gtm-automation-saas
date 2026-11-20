export async function onRequestGet(context: any) {
  const { request, env } = context;

  const clerkUserId = new URL(request.url).searchParams.get('clerkUserId');
  if (!clerkUserId || clerkUserId === 'undefined' || clerkUserId === 'null') {
    return new Response(JSON.stringify({ error: 'Missing or invalid clerkUserId' }), { status: 400 });
  }

  const rawEmail = (new URL(request.url).searchParams.get('email') || '').toLowerCase().trim();
  const ADMIN_EMAILS = [
    'ovi.cse23@gmail.com',
    'ovi@razibmarketing.net',
    'ovi@razibmarekting.net',
    'support@cogwheelmarketing.com'
  ];
  const isAdmin = ADMIN_EMAILS.includes(rawEmail);

  try {
    let dbResult = await env.DB.prepare(
      'SELECT subscription_tier, account_deployment_count FROM users WHERE id = ?'
    ).bind(clerkUserId).first();

    const email = rawEmail || 'unknown@example.com';

    if (!dbResult) {
       // Check if user exists by email
       const existingUser: any = await env.DB.prepare(
         'SELECT id, email, subscription_tier, account_deployment_count FROM users WHERE LOWER(email) = LOWER(?)'
       ).bind(email).first();

       if (existingUser) {
         if (existingUser.id !== clerkUserId) {
           try {
             await env.DB.prepare('PRAGMA foreign_keys = OFF;').run();
             await env.DB.batch([
               env.DB.prepare('UPDATE users SET id = ? WHERE id = ?').bind(clerkUserId, existingUser.id),
               env.DB.prepare('UPDATE gtm_connections SET user_id = ? WHERE user_id = ?').bind(clerkUserId, existingUser.id),
               env.DB.prepare('UPDATE audit_logs SET user_id = ? WHERE user_id = ?').bind(clerkUserId, existingUser.id),
               env.DB.prepare('UPDATE ga4_monitors SET user_id = ? WHERE user_id = ?').bind(clerkUserId, existingUser.id)
             ]);
             await env.DB.prepare('PRAGMA foreign_keys = ON;').run();
           } catch (e) {
             console.warn('Re-key user ID notice:', e);
           }
         }
         dbResult = existingUser;
       } else {
         const initialTier = isAdmin ? 'custom' : 'free';
         await env.DB.prepare(
           "INSERT INTO users (id, email, subscription_tier) VALUES (?, ?, ?)"
         ).bind(clerkUserId, email, initialTier).run();
         dbResult = { email, subscription_tier: initialTier, account_deployment_count: 0 };
       }
    }

    const resolvedEmail = (dbResult.email || rawEmail).toLowerCase().trim();
    if (isAdmin || ADMIN_EMAILS.includes(resolvedEmail)) {
      dbResult.subscription_tier = 'custom';
      dbResult.account_deployment_count = 0;
      // Ensure DB also permanently stores custom tier for this admin
      try {
        await env.DB.prepare("UPDATE users SET subscription_tier = 'custom' WHERE id = ? OR LOWER(email) = LOWER(?)")
          .bind(clerkUserId, resolvedEmail)
          .run();
      } catch (_) {}
    }

    let auditCount = 0;
    try {
      const auditRow: any = await env.DB.prepare('SELECT COUNT(*) as cnt FROM audit_logs WHERE user_id = ?').bind(clerkUserId).first();
      auditCount = auditRow ? (auditRow.cnt || 0) : 0;
    } catch (_) {}

    dbResult.audit_count = auditCount;

    return new Response(JSON.stringify(dbResult), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
