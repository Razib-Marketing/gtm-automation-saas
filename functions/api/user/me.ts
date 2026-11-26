import {
  ensureUsersSchema,
  ensureMonitorsSchema,
  ensureProjectsSchema,
  verifyClerkAuth,
  claimPendingAccess,
  isValidTimeHHMM,
  isValidTimezone,
  sanitizeTimezone
} from '../ga4/_shared';
import { isValidEmail } from '../_security';

const ADMIN_EMAILS = [
  'ovi.cse23@gmail.com',
  'ovi@razibmarketing.net',
  'ovi@razibmarekting.net',
  'support@cogwheelmarketing.com'
];

export async function onRequestGet(context: any) {
  const { request, env } = context;

  const auth = await verifyClerkAuth(request, env);
  if (!auth || !auth.userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const clerkUserId = auth.userId;
  const rawEmail = (new URL(request.url).searchParams.get('email') || '').toLowerCase().trim();
  const safeQueryEmail = isValidEmail(rawEmail) ? rawEmail : '';

  try {
    await ensureUsersSchema(env.DB);
    await ensureProjectsSchema(env.DB);

    let dbResult: any = await env.DB.prepare(
      `SELECT email, subscription_tier, account_deployment_count, schedule_time, schedule_timezone,
              workspace_limit, polar_customer_id, polar_subscription_id
       FROM users WHERE id = ?`
    )
      .bind(clerkUserId)
      .first();

    const verifiedJwtAdmin = Boolean(auth.email && ADMIN_EMAILS.includes(auth.email));

    if (!dbResult) {
      const initialEmail = auth.email || safeQueryEmail || 'unknown@example.com';
      const initialTier = verifiedJwtAdmin ? 'custom' : 'free';
      const initialLimit = verifiedJwtAdmin ? 100 : 0;

      await env.DB.prepare(
        `INSERT INTO users (id, email, subscription_tier, workspace_limit, schedule_time, schedule_timezone)
         VALUES (?, ?, ?, ?, '08:00', 'UTC')`
      )
        .bind(clerkUserId, initialEmail, initialTier, initialLimit)
        .run();

      dbResult = {
        email: initialEmail,
        subscription_tier: initialTier,
        account_deployment_count: 0,
        workspace_limit: initialLimit,
        schedule_time: '08:00',
        schedule_timezone: 'UTC',
        polar_customer_id: null,
        polar_subscription_id: null
      };
    } else if (
      safeQueryEmail &&
      (!dbResult.email || dbResult.email === 'unknown@example.com')
    ) {
      // Populate email only if user row currently lacks one and email is not claimed by an admin
      const candidateEmail = auth.email || (ADMIN_EMAILS.includes(safeQueryEmail) ? '' : safeQueryEmail);
      if (candidateEmail) {
        try {
          await env.DB.prepare('UPDATE users SET email = ? WHERE id = ?')
            .bind(candidateEmail, clerkUserId)
            .run();
          dbResult.email = candidateEmail;
        } catch (_) {}
      }
    }

    const trustedEmail = (auth.email || dbResult.email || '').toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.includes(trustedEmail);

    if (isAdmin) {
      dbResult.subscription_tier = 'custom';
      dbResult.account_deployment_count = 0;
      dbResult.workspace_limit = Math.max(Number(dbResult.workspace_limit || 0), 100);
      try {
        await env.DB.prepare(
          "UPDATE users SET subscription_tier = 'custom', workspace_limit = MAX(COALESCE(workspace_limit, 0), 100) WHERE id = ?"
        )
          .bind(clerkUserId)
          .run();
      } catch (_) {}
    }

    let auditCount = 0;
    try {
      const auditRow: any = await env.DB.prepare('SELECT COUNT(*) as cnt FROM audit_logs WHERE user_id = ?')
        .bind(clerkUserId)
        .first();
      auditCount = auditRow ? auditRow.cnt || 0 : 0;
    } catch (_) {}

    let projectCount = 0;
    try {
      const projRow: any = await env.DB.prepare(
        "SELECT COUNT(*) as cnt FROM projects WHERE user_id = ? AND (status IS NULL OR status = 'active')"
      )
        .bind(clerkUserId)
        .first();
      projectCount = projRow ? projRow.cnt || 0 : 0;
    } catch (_) {}

    await claimPendingAccess(env.DB, clerkUserId, trustedEmail);

    let hasSharedAccess = false;
    try {
      const sharedGrant: any = await env.DB.prepare(
        `SELECT 1 FROM project_access
         WHERE granted_to_user_id = ? OR (? != '' AND LOWER(granted_to_email) = LOWER(?))
         LIMIT 1`
      )
        .bind(clerkUserId, trustedEmail, trustedEmail)
        .first();
      const orgMem: any = await env.DB.prepare(
        `SELECT 1 FROM organization_members
         WHERE user_id = ? OR (? != '' AND LOWER(email) = LOWER(?))
         LIMIT 1`
      )
        .bind(clerkUserId, trustedEmail, trustedEmail)
        .first();
      const orgOwned: any = await env.DB.prepare(
        'SELECT 1 FROM organizations WHERE owner_user_id = ? LIMIT 1'
      )
        .bind(clerkUserId)
        .first();
      hasSharedAccess = Boolean(sharedGrant || orgMem || orgOwned);
    } catch (_) {}

    const activeTier = (dbResult.subscription_tier || 'free').toLowerCase();
    const fallbackLimit = activeTier === 'custom' ? 25 : activeTier === 'pro' ? 10 : 0;
    const workspaceLimit =
      Number(dbResult.workspace_limit || 0) > 0
        ? Number(dbResult.workspace_limit)
        : fallbackLimit;

    return new Response(
      JSON.stringify({
        email: dbResult.email,
        subscription_tier: dbResult.subscription_tier || 'free',
        account_deployment_count: dbResult.account_deployment_count || 0,
        workspace_limit: workspaceLimit,
        has_polar_customer: Boolean(dbResult.polar_customer_id),
        has_polar_subscription: Boolean(dbResult.polar_subscription_id),
        audit_count: auditCount,
        project_count: projectCount,
        has_shared_access: hasSharedAccess,
        has_active_subscription: activeTier === 'pro' || activeTier === 'custom',
        schedule_time: isValidTimeHHMM(dbResult.schedule_time) ? dbResult.schedule_time : '08:00',
        schedule_timezone: sanitizeTimezone(dbResult.schedule_timezone)
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('GET /api/user/me error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load user profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  const auth = await verifyClerkAuth(request, env);
  const userId = auth?.userId || null;

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
      return new Response(
        JSON.stringify({
          error: 'Invalid scheduleTime. Expected HH:MM in 24-hour format (e.g. 09:30).'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (rawTz && !isValidTimezone(rawTz)) {
      return new Response(
        JSON.stringify({ error: `Invalid IANA timezone: ${rawTz}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const safeTz = sanitizeTimezone(rawTz);

    await ensureUsersSchema(env.DB);
    await ensureMonitorsSchema(env.DB);

    const existing = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
    const safeEmail =
      auth?.email ||
      (typeof body.email === 'string' && isValidEmail(body.email) ? body.email.trim().toLowerCase() : '');

    if (!existing && safeEmail) {
      await env.DB.prepare(
        "INSERT INTO users (id, email, subscription_tier, schedule_time, schedule_timezone) VALUES (?, ?, 'free', ?, ?)"
      )
        .bind(userId, safeEmail, rawTime, safeTz)
        .run();
    } else {
      await env.DB.prepare(
        'UPDATE users SET schedule_time = ?, schedule_timezone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
        .bind(rawTime, safeTz, userId)
        .run();
    }

    if (applyToExistingMonitors) {
      await env.DB.prepare(
        'UPDATE ga4_monitors SET schedule_time = ?, schedule_timezone = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
      )
        .bind(rawTime, safeTz, userId)
        .run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        schedule_time: rawTime,
        schedule_timezone: safeTz,
        updatedMonitors: applyToExistingMonitors
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('POST /api/user/me error:', err);
    return new Response(JSON.stringify({ error: 'Failed to update schedule settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
