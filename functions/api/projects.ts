import {
  ensureUsersSchema,
  ensureMonitorsSchema,
  ensureAlertsSchema,
  ensureProjectsSchema,
  getClerkUserId
} from './ga4/_shared';

const ADMIN_EMAILS = [
  'ovi.cse23@gmail.com',
  'ovi@razibmarketing.net',
  'ovi@razibmarekting.net',
  'support@cogwheelmarketing.com'
];

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function resolveUserTier(db: any, userId: string): Promise<{ tier: string; email: string }> {
  let userRow: any = null;
  try {
    userRow = await db
      .prepare('SELECT email, subscription_tier FROM users WHERE id = ?')
      .bind(userId)
      .first();
  } catch (_) {}

  const email = (userRow?.email || '').toLowerCase().trim();
  const isAdmin = ADMIN_EMAILS.includes(email);
  const tier = isAdmin ? 'custom' : (userRow?.subscription_tier || 'free');
  return { tier, email };
}

async function enrichProjectStats(db: any, userId: string, project: any) {
  let monitorCount = 0;
  let alertCount = 0;
  let gtmAuditCount = 0;
  let ga4AuditCount = 0;
  let latestGtmScore: number | null = null;
  let latestGa4Score: number | null = null;

  try {
    const monRow: any = await db
      .prepare(
        `SELECT COUNT(*) as cnt FROM ga4_monitors
         WHERE user_id = ? AND (project_id = ? OR (project_id IS NULL AND ? != '' AND property_id = ?))`
      )
      .bind(userId, project.id, project.ga4_property_id || '', project.ga4_property_id || '')
      .first();
    monitorCount = monRow?.cnt || 0;
  } catch (_) {}

  try {
    const alertRow: any = await db
      .prepare(
        `SELECT COUNT(*) as cnt FROM ga4_alerts a
         LEFT JOIN ga4_monitors m ON a.monitor_id = m.id
         WHERE a.user_id = ? AND (a.project_id = ? OR m.project_id = ?)`
      )
      .bind(userId, project.id, project.id)
      .first();
    alertCount = alertRow?.cnt || 0;
  } catch (_) {}

  try {
    const gtmLatest: any = await db
      .prepare(
        `SELECT health_score FROM audit_logs
         WHERE user_id = ? AND (project_id = ? OR (project_id IS NULL AND ? != '' AND gtm_id = ?))
         ORDER BY created_at DESC LIMIT 1`
      )
      .bind(
        userId,
        project.id,
        project.gtm_container_public_id || '',
        project.gtm_container_public_id || ''
      )
      .first();
    if (gtmLatest && typeof gtmLatest.health_score === 'number') {
      latestGtmScore = gtmLatest.health_score;
    }

    const gtmCountRow: any = await db
      .prepare(
        `SELECT COUNT(*) as cnt FROM audit_logs
         WHERE user_id = ? AND (project_id = ? OR (project_id IS NULL AND ? != '' AND gtm_id = ?))`
      )
      .bind(
        userId,
        project.id,
        project.gtm_container_public_id || '',
        project.gtm_container_public_id || ''
      )
      .first();
    gtmAuditCount = gtmCountRow?.cnt || 0;
  } catch (_) {}

  try {
    const ga4Latest: any = await db
      .prepare(
        `SELECT health_score FROM ga4_audit_logs
         WHERE user_id = ? AND (project_id = ? OR (project_id IS NULL AND ? != '' AND property_id = ?))
         ORDER BY created_at DESC LIMIT 1`
      )
      .bind(userId, project.id, project.ga4_property_id || '', project.ga4_property_id || '')
      .first();
    if (ga4Latest && typeof ga4Latest.health_score === 'number') {
      latestGa4Score = ga4Latest.health_score;
    }

    const ga4CountRow: any = await db
      .prepare(
        `SELECT COUNT(*) as cnt FROM ga4_audit_logs
         WHERE user_id = ? AND (project_id = ? OR (project_id IS NULL AND ? != '' AND property_id = ?))`
      )
      .bind(userId, project.id, project.ga4_property_id || '', project.ga4_property_id || '')
      .first();
    ga4AuditCount = ga4CountRow?.cnt || 0;
  } catch (_) {}

  return {
    ...project,
    monitorCount,
    alertCount,
    recentAlertCount: alertCount,
    gtmAuditCount,
    ga4AuditCount,
    latestGtmScore,
    latestGa4Score
  };
}

export async function onRequest(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const jwtUserId = getClerkUserId(request);
  const queryUserId = url.searchParams.get('clerkUserId');
  const userId = jwtUserId || (request.method === 'GET' ? queryUserId : null);

  if (!userId || userId === 'undefined' || userId === 'null') {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    await ensureUsersSchema(env.DB);
    await ensureMonitorsSchema(env.DB);
    await ensureAlertsSchema(env.DB);
    await ensureProjectsSchema(env.DB);

    if (request.method === 'GET') {
      const projectId = url.searchParams.get('id');
      if (projectId) {
        const row: any = await env.DB.prepare(
          'SELECT * FROM projects WHERE id = ? AND user_id = ?'
        ).bind(projectId, userId).first();
        if (!row) {
          return json({ error: 'Project not found' }, 404);
        }
        const enriched = await enrichProjectStats(env.DB, userId, row);
        return json({ project: enriched }, 200);
      }

      const { results } = await env.DB.prepare(
        'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC'
      ).bind(userId).all();

      const enrichedList = await Promise.all(
        (results || []).map((row: any) => enrichProjectStats(env.DB, userId, row))
      );

      return json({ projects: enrichedList }, 200);
    }

    if (request.method === 'POST') {
      const { tier } = await resolveUserTier(env.DB, userId);
      if (tier === 'free') {
        return json(
          {
            error: 'An active paid subscription (Pro or Custom) is required to create projects. Please select a plan in Billing first.',
            requiresUpgrade: true
          },
          403
        );
      }

      const body = await request.json().catch(() => ({}));
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) {
        return json({ error: 'Project name is required.' }, 400);
      }

      const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const websiteUrl = typeof body.websiteUrl === 'string' ? body.websiteUrl.trim() : '';
      const websiteType = typeof body.websiteType === 'string' && body.websiteType.trim() ? body.websiteType.trim() : 'general';

      await env.DB.prepare(
        `INSERT INTO projects (
          id, user_id, name, website_url, website_type,
          gtm_account_id, gtm_account_name, gtm_container_id, gtm_container_name, gtm_container_public_id,
          gtm_workspace_id, gtm_workspace_name,
          ga4_property_id, ga4_property_name, measurement_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
      ).bind(
        projectId,
        userId,
        name,
        websiteUrl || null,
        websiteType,
        body.gtmAccountId || null,
        body.gtmAccountName || null,
        body.gtmContainerId || null,
        body.gtmContainerName || null,
        body.gtmContainerPublicId || null,
        body.gtmWorkspaceId || null,
        body.gtmWorkspaceName || null,
        body.ga4PropertyId || null,
        body.ga4PropertyName || null,
        body.measurementId || null
      ).run();

      const created: any = await env.DB.prepare(
        'SELECT * FROM projects WHERE id = ? AND user_id = ?'
      ).bind(projectId, userId).first();

      const enriched = await enrichProjectStats(env.DB, userId, created);
      return json({ success: true, project: enriched }, 201);
    }

    if (request.method === 'PUT' || request.method === 'PATCH') {
      const body = await request.json().catch(() => ({}));
      const projectId = body.id || url.searchParams.get('id');
      if (!projectId) {
        return json({ error: 'Missing project id' }, 400);
      }

      const existing: any = await env.DB.prepare(
        'SELECT * FROM projects WHERE id = ? AND user_id = ?'
      ).bind(projectId, userId).first();

      if (!existing) {
        return json({ error: 'Project not found' }, 404);
      }

      const nextName = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : existing.name;
      const nextWebsiteUrl = body.websiteUrl !== undefined ? (body.websiteUrl || null) : existing.website_url;
      const nextWebsiteType = body.websiteType !== undefined ? (body.websiteType || 'general') : existing.website_type;

      await env.DB.prepare(
        `UPDATE projects SET
          name = ?,
          website_url = ?,
          website_type = ?,
          gtm_account_id = ?,
          gtm_account_name = ?,
          gtm_container_id = ?,
          gtm_container_name = ?,
          gtm_container_public_id = ?,
          gtm_workspace_id = ?,
          gtm_workspace_name = ?,
          ga4_property_id = ?,
          ga4_property_name = ?,
          measurement_id = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`
      ).bind(
        nextName,
        nextWebsiteUrl,
        nextWebsiteType,
        body.gtmAccountId !== undefined ? (body.gtmAccountId || null) : existing.gtm_account_id,
        body.gtmAccountName !== undefined ? (body.gtmAccountName || null) : existing.gtm_account_name,
        body.gtmContainerId !== undefined ? (body.gtmContainerId || null) : existing.gtm_container_id,
        body.gtmContainerName !== undefined ? (body.gtmContainerName || null) : existing.gtm_container_name,
        body.gtmContainerPublicId !== undefined ? (body.gtmContainerPublicId || null) : existing.gtm_container_public_id,
        body.gtmWorkspaceId !== undefined ? (body.gtmWorkspaceId || null) : existing.gtm_workspace_id,
        body.gtmWorkspaceName !== undefined ? (body.gtmWorkspaceName || null) : existing.gtm_workspace_name,
        body.ga4PropertyId !== undefined ? (body.ga4PropertyId || null) : existing.ga4_property_id,
        body.ga4PropertyName !== undefined ? (body.ga4PropertyName || null) : existing.ga4_property_name,
        body.measurementId !== undefined ? (body.measurementId || null) : existing.measurement_id,
        projectId,
        userId
      ).run();

      const updated: any = await env.DB.prepare(
        'SELECT * FROM projects WHERE id = ? AND user_id = ?'
      ).bind(projectId, userId).first();
      const enriched = await enrichProjectStats(env.DB, userId, updated);
      return json({ success: true, project: enriched }, 200);
    }

    if (request.method === 'DELETE') {
      const projectId = url.searchParams.get('id');
      if (!projectId) {
        return json({ error: 'Missing project id' }, 400);
      }

      // Remove monitors created strictly under this project
      try {
        await env.DB.prepare('DELETE FROM ga4_monitors WHERE project_id = ? AND user_id = ?')
          .bind(projectId, userId)
          .run();
      } catch (_) {}

      await env.DB.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?')
        .bind(projectId, userId)
        .run();

      return json({ success: true }, 200);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message || 'Internal server error' }, 500);
  }
}
