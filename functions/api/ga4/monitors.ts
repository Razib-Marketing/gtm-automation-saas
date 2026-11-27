import {
  ensureUsersSchema,
  ensureMonitorsSchema,
  ensureAlertsSchema,
  ensureProjectsSchema,
  verifyClerkAuth,
  resolveProjectAccess,
  canEditProject,
  isValidTimeHHMM,
  sanitizeTimezone
} from './_shared';
import { isValidGa4PropertyId, isUnlimitedAdminEmail } from '../_security';

export async function onRequest(context: any) {
  const { env, request } = context;
  const auth = await verifyClerkAuth(request, env);
  const userId = auth?.userId || null;

  if (!auth || !userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (request.method === 'GET') {
    try {
      await ensureAlertsSchema(env.DB);
      await ensureMonitorsSchema(env.DB);
      await ensureUsersSchema(env.DB);
      await ensureProjectsSchema(env.DB);

      const url = new URL(request.url);
      const filterProjectId = url.searchParams.get('projectId') || '';
      const filterPropertyId = url.searchParams.get('propertyId') || '';

      const userScheduleRow: any = await env.DB.prepare(
        'SELECT schedule_time, schedule_timezone FROM users WHERE id = ?'
      ).bind(userId).first().catch(() => null);

      const userScheduleTime = isValidTimeHHMM(userScheduleRow?.schedule_time)
        ? userScheduleRow.schedule_time
        : '08:00';
      const userScheduleTimezone = sanitizeTimezone(userScheduleRow?.schedule_timezone);

      let rawMonitors: any[] = [];
      let scopeOwnerId = userId;
      let projectAccessRole = 'owner';

      if (filterProjectId) {
        const access = await resolveProjectAccess(env.DB, auth, filterProjectId);
        if (!access) {
          return new Response(JSON.stringify({ error: 'Project not found or access denied' }), { status: 404 });
        }
        scopeOwnerId = access.project.user_id;
        projectAccessRole = access.role;

        const res = await env.DB.prepare(
          `SELECT * FROM ga4_monitors
           WHERE (status IS NULL OR status = 'active')
             AND (project_id = ? OR (project_id IS NULL AND user_id = ? AND ? != '' AND property_id = ?))
           ORDER BY created_at DESC`
        ).bind(filterProjectId, scopeOwnerId, filterPropertyId, filterPropertyId).all();
        rawMonitors = res.results || [];
      } else {
        const res = await env.DB.prepare(
          "SELECT * FROM ga4_monitors WHERE user_id = ? AND (status IS NULL OR status = 'active') ORDER BY created_at DESC"
        ).bind(userId).all();
        rawMonitors = res.results || [];
      }

      const { results: rawAlerts } = await env.DB.prepare(
        'SELECT * FROM ga4_alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
      ).bind(scopeOwnerId).all();

      const allowedMonitorIds = new Set(rawMonitors.map((m: any) => m.id));
      const filteredRawAlerts = filterProjectId
        ? (rawAlerts || []).filter((a: any) => a.project_id === filterProjectId || allowedMonitorIds.has(a.monitor_id))
        : (rawAlerts || []);

      const alerts = filteredRawAlerts.map((a: any) => ({
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
        accessRole: projectAccessRole,
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
      await ensureProjectsSchema(env.DB);

      const body = await request.json();
      const { id, propertyId, propertyName, comparisonPeriod, matchType } = body;
      const projectId = typeof body.projectId === 'string' && body.projectId.trim() ? body.projectId.trim() : null;

      let sharedOwnerId: string | null = null;
      if (projectId) {
        const projAccess = await resolveProjectAccess(env.DB, auth, projectId);
        if (!projAccess) {
          return new Response(JSON.stringify({ error: 'Project not found or access denied' }), { status: 404 });
        }
        if (!canEditProject(projAccess.role)) {
          return new Response(JSON.stringify({ error: 'Viewers cannot create or edit GA4 monitors.' }), { status: 403 });
        }
        sharedOwnerId = projAccess.project.user_id;
      }

      let userRow: any = null;
      try {
        userRow = await env.DB.prepare(
          'SELECT email, subscription_tier, schedule_time, schedule_timezone FROM users WHERE id = ?'
        ).bind(userId).first();
      } catch (_) {}

      const isAdmin = isUnlimitedAdminEmail(auth.email) || isUnlimitedAdminEmail(userRow?.email);
      const tier = isAdmin ? 'custom' : (userRow?.subscription_tier || 'free');

      // Allow shared editors/admins on an active project even if their personal account is free
      if (tier === 'free' && !sharedOwnerId) {
        return new Response(JSON.stringify({
          error: 'An active paid subscription (Pro or Custom) is required to activate GA4 anomaly monitors. Please choose a plan in Billing.',
          requiresUpgrade: true
        }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }

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

      if (!propertyId || !isValidGa4PropertyId(propertyId) || !alertEmail) {
        return new Response(JSON.stringify({ error: 'Missing or invalid propertyId or alertEmail' }), { status: 400 });
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
        // Update existing (scoped to owner OR shared project)
        if (projectId) {
          await env.DB.prepare(
            `UPDATE ga4_monitors
            SET project_id = COALESCE(?, project_id), property_id = ?, property_name = ?, metric = ?, threshold_percentage = ?, comparison_period = ?, alert_email = ?, condition_type = ?, conditions = ?, match_type = ?, schedule_time = ?, schedule_timezone = ?, schedule_frequency = ?, website_type = ?, status = 'active', updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND (user_id = ? OR project_id = ?)`
          ).bind(
            projectId,
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
            userId,
            projectId
          ).run();
        } else {
          await env.DB.prepare(
            `UPDATE ga4_monitors
            SET project_id = COALESCE(?, project_id), property_id = ?, property_name = ?, metric = ?, threshold_percentage = ?, comparison_period = ?, alert_email = ?, condition_type = ?, conditions = ?, match_type = ?, schedule_time = ?, schedule_timezone = ?, schedule_frequency = ?, website_type = ?, status = 'active', updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?`
          ).bind(
            projectId,
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
        }
      } else {
        // Create new
        monitorId = 'mon_' + Date.now() + Math.random().toString(36).substring(2, 9);
        const ownerUserId = sharedOwnerId || userId;
        await env.DB.prepare(
          `INSERT INTO ga4_monitors
          (id, user_id, project_id, property_id, property_name, metric, threshold_percentage, comparison_period, alert_email, condition_type, conditions, match_type, schedule_time, schedule_timezone, schedule_frequency, website_type, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
        ).bind(
          monitorId,
          ownerUserId,
          projectId,
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

      const monRow: any = await env.DB.prepare('SELECT id, user_id, project_id FROM ga4_monitors WHERE id = ?')
        .bind(id)
        .first();
      if (!monRow) return new Response(JSON.stringify({ error: 'Monitor not found' }), { status: 404 });

      let authorized = monRow.user_id === userId;
      if (!authorized && monRow.project_id) {
        const access = await resolveProjectAccess(env.DB, auth, monRow.project_id);
        if (access && canEditProject(access.role)) authorized = true;
      }
      if (!authorized) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }

      await env.DB.prepare('DELETE FROM ga4_monitors WHERE id = ?').bind(id).run();

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}
