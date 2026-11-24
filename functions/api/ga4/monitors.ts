import {
  ensureUsersSchema,
  ensureMonitorsSchema,
  ensureAlertsSchema,
  getClerkUserId,
  isValidTimeHHMM,
  sanitizeTimezone
} from './_shared';

export async function onRequest(context: any) {
  const { env, request } = context;
  const userId = getClerkUserId(request);

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (request.method === 'GET') {
    try {
      await ensureAlertsSchema(env.DB);
      await ensureMonitorsSchema(env.DB);
      await ensureUsersSchema(env.DB);

      const userScheduleRow: any = await env.DB.prepare(
        'SELECT schedule_time, schedule_timezone FROM users WHERE id = ?'
      ).bind(userId).first().catch(() => null);

      const userScheduleTime = isValidTimeHHMM(userScheduleRow?.schedule_time)
        ? userScheduleRow.schedule_time
        : '08:00';
      const userScheduleTimezone = sanitizeTimezone(userScheduleRow?.schedule_timezone);

      const { results: rawMonitors } = await env.DB.prepare(
        'SELECT * FROM ga4_monitors WHERE user_id = ? ORDER BY created_at DESC'
      ).bind(userId).all();

      const { results: rawAlerts } = await env.DB.prepare(
        'SELECT * FROM ga4_alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
      ).bind(userId).all();

      const alerts = (rawAlerts || []).map((a: any) => ({
        ...a,
        alert_type: a.alert_type || (a.metric?.toLowerCase().startsWith('manual') ? 'manual' : 'automated'),
        status: a.status || (a.condition_type === 'stable' ? 'stable' : 'anomaly')
      }));

      // Normalize conditions, match_type, schedule, and website_type for each monitor
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
              source: 'all',
              medium: 'all',
              device: 'all',
              conditionType: m.condition_type || 'drops_below',
              thresholdPercentage: m.threshold_percentage
            }
          ];
        }

        return {
          ...m,
          conditions: parsedConditions,
          matchType: m.match_type || 'ANY',
          scheduleTime: isValidTimeHHMM(m.schedule_time) ? m.schedule_time : userScheduleTime,
          scheduleTimezone: sanitizeTimezone(m.schedule_timezone || userScheduleTimezone),
          scheduleFrequency: ['daily', 'weekly', 'monthly'].includes((m.schedule_frequency || '').toLowerCase())
            ? m.schedule_frequency.toLowerCase()
            : 'daily',
          websiteType: m.website_type || 'general'
        };
      });

      return new Response(JSON.stringify({
        monitors,
        alerts,
        accountSchedule: {
          time: userScheduleTime,
          timezone: userScheduleTimezone
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  if (request.method === 'POST') {
    try {
      await ensureMonitorsSchema(env.DB);
      await ensureUsersSchema(env.DB);

      let userRow: any = null;
      try {
        userRow = await env.DB.prepare(
          'SELECT email, subscription_tier, schedule_time, schedule_timezone FROM users WHERE id = ?'
        ).bind(userId).first();
      } catch (_) {}

      const userEmail = (userRow?.email || '').toLowerCase().trim();
      const ADMIN_EMAILS = [
        'ovi.cse23@gmail.com',
        'ovi@razibmarketing.net',
        'ovi@razibmarekting.net',
        'support@cogwheelmarketing.com'
      ];
      const isAdmin = ADMIN_EMAILS.includes(userEmail);
      const tier = isAdmin ? 'custom' : (userRow?.subscription_tier || 'free');

      if (tier === 'free') {
        return new Response(JSON.stringify({
          error: 'An active paid subscription (Pro or Custom) is required to activate GA4 anomaly monitors. Please choose a plan on our pricing page.',
          requiresUpgrade: true
        }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }

      const body = await request.json();
      const { id, propertyId, propertyName, comparisonPeriod, matchType } = body;

      let alertEmail = body.alertEmail;
      if (Array.isArray(body.alertEmails) && body.alertEmails.length > 0) {
        alertEmail = body.alertEmails.map((e: string) => e.trim()).filter((e: string) => e.includes('@')).join(', ');
      } else if (typeof alertEmail === 'string') {
        alertEmail = alertEmail.split(/[,;\s]+/).map((e: string) => e.trim()).filter((e: string) => e.includes('@')).join(', ');
      }

      let conditions = body.conditions;
      // Fallback if legacy single metric format sent
      if (!conditions || !Array.isArray(conditions) || conditions.length === 0) {
        if (!body.metric || body.thresholdPercentage === undefined) {
          return new Response(JSON.stringify({ error: 'Missing conditions or metric' }), { status: 400 });
        }
        conditions = [
          {
            metric: body.metric,
            source: body.source || 'all',
            medium: body.medium || 'all',
            device: body.device || 'all',
            conditionType: body.conditionType || 'drops_below',
            thresholdPercentage: parseFloat(String(body.thresholdPercentage))
          }
        ];
      }

      if (!propertyId || !alertEmail) {
        return new Response(JSON.stringify({ error: 'Missing propertyId or valid alertEmail' }), { status: 400 });
      }

      const sanitizedConditions = conditions.map((c: any) => {
        const cType = c.conditionType || c.condition_type || 'drops_below';
        const rawThresh = c.thresholdPercentage ?? c.threshold_percentage ?? 0;
        const parsedThresh = cType === 'equals_zero' ? 0 : parseFloat(String(rawThresh));
        return {
          metric: c.metric || 'sessions',
          source: c.source || 'all',
          medium: c.medium || 'all',
          device: c.device || 'all',
          conditionType: cType,
          thresholdPercentage: Number.isFinite(parsedThresh) ? parsedThresh : 0
        };
      });

      const primaryMetric = sanitizedConditions[0].metric;
      const primaryCondition = sanitizedConditions[0].conditionType;
      const primaryThreshold = sanitizedConditions[0].thresholdPercentage;
      const conditionsJson = JSON.stringify(sanitizedConditions);
      const resolvedMatchType = matchType === 'ALL' ? 'ALL' : 'ANY';

      const defaultTime = isValidTimeHHMM(userRow?.schedule_time) ? userRow.schedule_time : '08:00';
      const defaultTimezone = sanitizeTimezone(userRow?.schedule_timezone);

      const resolvedScheduleTime = isValidTimeHHMM(body.scheduleTime)
        ? body.scheduleTime.trim()
        : defaultTime;
      const resolvedScheduleTimezone = body.scheduleTimezone
        ? sanitizeTimezone(body.scheduleTimezone)
        : defaultTimezone;
      const rawFreq = typeof body.scheduleFrequency === 'string' ? body.scheduleFrequency.toLowerCase().trim() : 'daily';
      const resolvedScheduleFrequency = ['daily', 'weekly', 'monthly'].includes(rawFreq) ? rawFreq : 'daily';
      const resolvedWebsiteType = typeof body.websiteType === 'string' && body.websiteType.trim()
        ? body.websiteType.trim()
        : 'general';

      let monitorId = id;
      if (id) {
        // Update existing
        await env.DB.prepare(
          `UPDATE ga4_monitors
          SET property_id = ?, property_name = ?, metric = ?, threshold_percentage = ?, comparison_period = ?, alert_email = ?, condition_type = ?, conditions = ?, match_type = ?, schedule_time = ?, schedule_timezone = ?, schedule_frequency = ?, website_type = ?, updated_at = CURRENT_TIMESTAMP
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
          resolvedScheduleTime,
          resolvedScheduleTimezone,
          resolvedScheduleFrequency,
          resolvedWebsiteType,
          id,
          userId
        ).run();
      } else {
        // Create new
        monitorId = 'mon_' + Date.now() + Math.random().toString(36).substring(2, 9);
        await env.DB.prepare(
          `INSERT INTO ga4_monitors
          (id, user_id, property_id, property_name, metric, threshold_percentage, comparison_period, alert_email, condition_type, conditions, match_type, schedule_time, schedule_timezone, schedule_frequency, website_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
          resolvedMatchType,
          resolvedScheduleTime,
          resolvedScheduleTimezone,
          resolvedScheduleFrequency,
          resolvedWebsiteType
        ).run();
      }

      if (body.saveAsAccountDefault === true) {
        try {
          await env.DB.prepare(
            'UPDATE users SET schedule_time = ?, schedule_timezone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
          ).bind(resolvedScheduleTime, resolvedScheduleTimezone, userId).run();
        } catch (_) {}
      }

      return new Response(JSON.stringify({
        success: true,
        id: monitorId,
        scheduleTime: resolvedScheduleTime,
        scheduleTimezone: resolvedScheduleTimezone,
        scheduleFrequency: resolvedScheduleFrequency,
        websiteType: resolvedWebsiteType
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
