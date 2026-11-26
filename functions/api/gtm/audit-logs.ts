import { ensureProjectsSchema, getClerkAuthContext, resolveProjectAccess } from '../ga4/_shared';

export async function onRequest(context: any) {
  const { request, env } = context;

  if (request.method === 'POST') {
    return handleSaveLog(request, env);
  } else if (request.method === 'GET') {
    return handleGetLogs(request, env);
  }

  return new Response('Method not allowed', { status: 405 });
}

async function handleSaveLog(request: Request, env: any) {
  try {
    await ensureProjectsSchema(env.DB);
    const { userId, projectId, gtmId, healthScore, issueCount, rawData } = (await request.json()) as any;

    if (!userId || !gtmId || healthScore === undefined || issueCount === undefined || !rawData) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const id = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, project_id, gtm_id, health_score, issue_count, raw_data) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, userId, projectId || null, gtmId, healthScore, issueCount, JSON.stringify(rawData)).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error saving audit log:', err.message);
    return new Response(JSON.stringify({ error: 'Failed to save audit log' }), { status: 500 });
  }
}

async function handleGetLogs(request: Request, env: any) {
  try {
    await ensureProjectsSchema(env.DB);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const projectId = url.searchParams.get('projectId') || '';
    const gtmId = url.searchParams.get('gtmId') || '';

    if (!userId || userId === 'undefined' || userId === 'null') {
      return new Response(JSON.stringify({ error: 'Missing or invalid userId parameter' }), { status: 400 });
    }

    let results: any[] = [];
    if (projectId) {
      const authCtx = getClerkAuthContext(request);
      const access = await resolveProjectAccess(
        env.DB,
        authCtx || userId,
        projectId
      );
      const ownerId = access?.project?.user_id || userId;
      const res = await env.DB.prepare(
        `SELECT id, project_id, gtm_id, health_score, issue_count, raw_data, created_at
         FROM audit_logs
         WHERE project_id = ?
            OR (project_id IS NULL AND user_id = ? AND ? != '' AND gtm_id = ?)
         ORDER BY created_at DESC LIMIT 50`
      ).bind(projectId, ownerId, gtmId, gtmId).all();
      results = res.results || [];
    } else if (gtmId) {
      const res = await env.DB.prepare(
        `SELECT id, project_id, gtm_id, health_score, issue_count, raw_data, created_at
         FROM audit_logs
         WHERE user_id = ? AND gtm_id = ?
         ORDER BY created_at DESC LIMIT 50`
      ).bind(userId, gtmId).all();
      results = res.results || [];
    } else {
      const res = await env.DB.prepare(
        `SELECT id, project_id, gtm_id, health_score, issue_count, raw_data, created_at
         FROM audit_logs
         WHERE user_id = ?
         ORDER BY created_at DESC LIMIT 50`
      ).bind(userId).all();
      results = res.results || [];
    }

    const logs = results.map((row: any) => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(row.raw_data);
      } catch (_) {}
      return {
        id: row.id,
        projectId: row.project_id || null,
        gtmId: row.gtm_id,
        healthScore: row.health_score,
        issueCount: row.issue_count,
        tagCount: parsed?.summary?.totalTags ?? parsed?.tagCount ?? 0,
        triggerCount: parsed?.summary?.totalTriggers ?? parsed?.triggerCount ?? 0,
        variableCount: parsed?.summary?.totalVariables ?? parsed?.variableCount ?? 0,
        rawData: parsed,
        createdAt: row.created_at
      };
    });

    return new Response(JSON.stringify({ logs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error fetching audit logs:', err.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch audit logs' }), { status: 500 });
  }
}
