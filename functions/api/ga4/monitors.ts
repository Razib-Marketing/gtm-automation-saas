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
      const { results: rawMonitors } = await env.DB.prepare(
        'SELECT * FROM ga4_monitors WHERE user_id = ? ORDER BY created_at DESC'
      ).bind(userId).all();
      
      const { results: alerts } = await env.DB.prepare(
        'SELECT * FROM ga4_alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
      ).bind(userId).all();

      // Normalize conditions and match_type for each monitor
      const monitors = (rawMonitors || []).map((m: any) => {
        let parsedConditions = [];
        if (m.conditions) {
          try {
            parsedConditions = JSON.parse(m.conditions);
          } catch (_) {}
        }
        if (!parsedConditions || parsedConditions.length === 0) {
          parsedConditions = [
            {
              metric: m.metric,
              conditionType: m.condition_type || 'drops_below',
              thresholdPercentage: m.threshold_percentage
            }
          ];
        }

        return {
          ...m,
          conditions: parsedConditions,
          matchType: m.match_type || 'ANY'
        };
      });

      return new Response(JSON.stringify({ monitors, alerts }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { id, propertyId, propertyName, comparisonPeriod, alertEmail, matchType } = body;
      
      let conditions = body.conditions;
      // Fallback if legacy single metric format sent
      if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
        if (!body.metric || body.thresholdPercentage === undefined) {
          return new Response(JSON.stringify({ error: 'Missing conditions or metric' }), { status: 400 });
        }
        conditions = [
          {
            metric: body.metric,
            conditionType: body.conditionType || 'drops_below',
            thresholdPercentage: parseFloat(body.thresholdPercentage)
          }
        ];
      }

      if (!propertyId || !alertEmail) {
        return new Response(JSON.stringify({ error: 'Missing propertyId or alertEmail' }), { status: 400 });
      }

      const primaryMetric = conditions[0].metric;
      const primaryCondition = conditions[0].conditionType || conditions[0].condition_type || 'drops_below';
      const primaryThreshold = parseFloat(conditions[0].thresholdPercentage || conditions[0].threshold_percentage || '0');
      const conditionsJson = JSON.stringify(conditions);
      const resolvedMatchType = matchType === 'ALL' ? 'ALL' : 'ANY';

      let monitorId = id;
      if (id) {
        // Update existing
        await env.DB.prepare(
          `UPDATE ga4_monitors 
          SET property_id = ?, property_name = ?, metric = ?, threshold_percentage = ?, comparison_period = ?, alert_email = ?, condition_type = ?, conditions = ?, match_type = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?`
        ).bind(
          propertyId, 
          propertyName || propertyId, 
          primaryMetric, 
          primaryThreshold, 
          comparisonPeriod || 'yesterday_vs_last_week', 
          alertEmail, 
          primaryCondition, 
          conditionsJson, 
          resolvedMatchType, 
          id, 
          userId
        ).run();
      } else {
        // Create new
        monitorId = 'mon_' + Date.now() + Math.random().toString(36).substring(2, 9);
        await env.DB.prepare(
          `INSERT INTO ga4_monitors 
          (id, user_id, property_id, property_name, metric, threshold_percentage, comparison_period, alert_email, condition_type, conditions, match_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          monitorId, 
          userId, 
          propertyId, 
          propertyName || propertyId, 
          primaryMetric, 
          primaryThreshold, 
          comparisonPeriod || 'yesterday_vs_last_week', 
          alertEmail, 
          primaryCondition, 
          conditionsJson, 
          resolvedMatchType
        ).run();
      }

      return new Response(JSON.stringify({ success: true, id: monitorId }), { status: 200 });
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
