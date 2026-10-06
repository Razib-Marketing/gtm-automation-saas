import { getGoogleAccessToken } from '../gtm/_utils';

function getClerkUserId(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    let payloadBase64 = token.split('.')[1];
    payloadBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    while (payloadBase64.length % 4) {
      payloadBase64 += '=';
    }
    const payload = JSON.parse(atob(payloadBase64));
    return payload.sub;
  } catch (e) {
    return null;
  }
}

export async function onRequest(context: any) {
  const { env, request } = context;
  const userId = getClerkUserId(request);

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (request.method === 'GET') {
    try {
      const { results } = await env.DB.prepare(
        'SELECT * FROM ga4_monitors WHERE user_id = ? ORDER BY created_at DESC'
      ).bind(userId).all();
      
      return new Response(JSON.stringify({ monitors: results }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST') {
    try {
      const { propertyId, propertyName, metric, thresholdPercentage, comparisonPeriod, alertEmail, conditionType } = await request.json();
      
      if (!propertyId || !metric || !thresholdPercentage || !alertEmail) {
        return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
      }

      const id = 'mon_' + Date.now() + Math.random().toString(36).substring(2, 9);
      
      await env.DB.prepare(
        `INSERT INTO ga4_monitors 
        (id, user_id, property_id, property_name, metric, threshold_percentage, comparison_period, alert_email, condition_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(id, userId, propertyId, propertyName || propertyId, metric, thresholdPercentage, comparisonPeriod || 'daily', alertEmail, conditionType || 'drops_below').run();

      return new Response(JSON.stringify({ success: true, id }), { status: 200 });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'DELETE') {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      
      if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
      
      await env.DB.prepare('DELETE FROM ga4_monitors WHERE id = ? AND user_id = ?').bind(id, userId).run();
      
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}
