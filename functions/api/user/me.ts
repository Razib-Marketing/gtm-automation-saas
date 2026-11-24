import {
  ensureUsersSchema,
  ensureMonitorsSchema,
  getClerkUserId,
  isValidTimeHHMM,
  isValidTimezone,
  sanitizeTimezone
} from '../ga4/_shared';

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
    await ensureUsersSchema(env.DB);

    let dbResult = await env.DB.prepare(
      'SELECT email, subscription_tier, account_deployment_count, schedule_time, schedule_timezone FROM users WHERE id = ?'
    ).bind(clerkUserId).first();

    const email = rawEmail || 'unknown@example.com';

    if (!dbResult) {
       // Check if user exists by email
       const existingUser: any = await env.DB.prepare(
         'SELECT id, email, subscription_tier, account_deployment_count, schedule_time, schedule_timezone FROM users WHERE LOWER(email) = LOWER(?)'
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
           "INSERT INTO users (id, email, subscription_tier, schedule_time, schedule_timezone) VALUES (?, ?, ?, '08:00', 'UTC')"
         ).bind(clerkUserId, email, initialTier).run();
         dbResult = {
           email,
           subscription_tier: initialTier,
           account_deployment_count: 0,
           schedule_time: '08:00',
           schedule_timezone: 'UTC'
         };
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
    dbResult.schedule_time = isValidTimeHHMM(dbResult.schedule_time) ? dbResult.schedule_time : '08:00';
    dbResult.schedule_timezone = sanitizeTimezone(dbResult.schedule_timezone);

    return new Response(JSON.stringify(dbResult), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  const userId = getClerkUserId(request);

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawTime = typeof body.scheduleTime === 'string' ? body.scheduleTime.trim() : '';
    const rawTz = typeof body.scheduleTimezone === 'string' ? body.scheduleTimezone.trim() : 'UTC';
    const applyToExistingMonitors = Boolean(body.applyToExistingMonitors);

    if (!isValidTimeHHMM(rawTime)) {
      return new Response(JSON.stringify({ error: 'Invalid scheduleTime. Expected HH:MM in 24-hour format (e.g. 09:30).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (rawTz && !isValidTimezone(rawTz)) {
      return new Response(JSON.stringify({ error: `Invalid IANA timezone: ${rawTz}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const safeTz = sanitizeTimezone(rawTz);

    await ensureUsersSchema(env.DB);
    await ensureMonitorsSchema(env.DB);

    const existing = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
    if (!existing && typeof body.email === 'string' && body.email.trim()) {
      await env.DB.prepare(
        "INSERT INTO users (id, email, subscription_tier, schedule_time, schedule_timezone) VALUES (?, ?, 'free', ?, ?)"
      ).bind(userId, body.email.trim(), rawTime, safeTz).run();
    } else {
      await env.DB.prepare(
        'UPDATE users SET schedule_time = ?, schedule_timezone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(rawTime, safeTz, userId).run();
    }

    if (applyToExistingMonitors) {
      await env.DB.prepare(
        'UPDATE ga4_monitors SET schedule_time = ?, schedule_timezone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
      ).bind(rawTime, safeTz, userId).run();
    }

    return new Response(JSON.stringify({
      success: true,
      schedule_time: rawTime,
      schedule_timezone: safeTz,
      updatedMonitors: applyToExistingMonitors
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
