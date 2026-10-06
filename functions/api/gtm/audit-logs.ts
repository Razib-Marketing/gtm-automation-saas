export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'POST') {
    return handleSaveLog(request, env);
  } else if (request.method === 'GET') {
    return handleGetLogs(request, env);
  }

  return new Response('Method not allowed', { status: 405 });
}

async function handleSaveLog(request, env) {
  try {
    const { userId, gtmId, healthScore, issueCount, rawData } = await request.json();

    if (!userId || !gtmId || healthScore === undefined || issueCount === undefined || !rawData) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const id = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, gtm_id, health_score, issue_count, raw_data) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, userId, gtmId, healthScore, issueCount, JSON.stringify(rawData)).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error saving audit log:', err.message);
    return new Response(JSON.stringify({ error: 'Failed to save audit log' }), { status: 500 });
  }
}

async function handleGetLogs(request, env) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId || userId === 'undefined' || userId === 'null') {
      return new Response(JSON.stringify({ error: 'Missing or invalid userId parameter' }), { status: 400 });
    }

    const { results } = await env.DB.prepare(
      `SELECT id, gtm_id, health_score, issue_count, raw_data, created_at FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
    ).bind(userId).all();

    // Parse raw_data back to object so the frontend can use it directly
    const logs = results.map(row => ({
      id: row.id,
      gtmId: row.gtm_id,
      healthScore: row.health_score,
      issueCount: row.issue_count,
      rawData: JSON.parse(row.raw_data),
      createdAt: row.created_at
    }));

    return new Response(JSON.stringify({ logs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err.message);
    return new Response(JSON.stringify({ error: 'Failed to fetch audit logs' }), { status: 500 });
  }
}
