import {
  ensureUsersSchema,
  ensureMonitorsSchema,
  ensureAlertsSchema,
  ensureProjectsSchema,
  getClerkAuthContext,
  resolveUserEmail,
  claimPendingAccess,
  resolveProjectAccess,
  resolveOrganizationAccess,
  canEditProject,
  canManageProject,
  normalizeAccessRole,
  roleRank,
  ClerkAuthContext,
  AccessRole
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

async function permanentlyDeleteProjectCascade(db: any, project: any) {
  const projectId = project.id;
  const ownerId = project.user_id;
  const propId = project.ga4_property_id || '';
  const gtmPublicId = project.gtm_container_public_id || '';

  // Check if another active project by this owner still references the same GA4 property
  let cleanLegacyProperty = false;
  if (propId) {
    try {
      const otherActive: any = await db
        .prepare(
          `SELECT COUNT(*) as cnt FROM projects
           WHERE user_id = ? AND id != ? AND ga4_property_id = ? AND (status IS NULL OR status = 'active')`
        )
        .bind(ownerId, projectId, propId)
        .first();
      cleanLegacyProperty = (otherActive?.cnt || 0) === 0;
    } catch (_) {
      cleanLegacyProperty = false;
    }
  }

  // Delete alerts scoped to this project or its monitors
  try {
    await db
      .prepare(
        `DELETE FROM ga4_alerts
         WHERE project_id = ?
            OR monitor_id IN (SELECT id FROM ga4_monitors WHERE project_id = ?)`
      )
      .bind(projectId, projectId)
      .run();
  } catch (_) {}

  if (cleanLegacyProperty && propId) {
    try {
      await db
        .prepare(
          `DELETE FROM ga4_alerts
           WHERE monitor_id IN (
             SELECT id FROM ga4_monitors WHERE user_id = ? AND project_id IS NULL AND property_id = ?
           )`
        )
        .bind(ownerId, propId)
        .run();
    } catch (_) {}
  }

  // Delete monitors strictly scoped to this project (and unused legacy unscoped monitors)
  try {
    await db
      .prepare('DELETE FROM ga4_monitors WHERE project_id = ?')
      .bind(projectId)
      .run();
  } catch (_) {}

  if (cleanLegacyProperty && propId) {
    try {
      await db
        .prepare('DELETE FROM ga4_monitors WHERE user_id = ? AND project_id IS NULL AND property_id = ?')
        .bind(ownerId, propId)
        .run();
    } catch (_) {}
  }

  // Clean up GA4 & GTM audit logs
  try {
    await db.prepare('DELETE FROM ga4_audit_logs WHERE project_id = ?').bind(projectId).run();
  } catch (_) {}
  try {
    await db.prepare('DELETE FROM audit_logs WHERE project_id = ?').bind(projectId).run();
  } catch (_) {}

  if (cleanLegacyProperty && propId) {
    try {
      await db
        .prepare('DELETE FROM ga4_audit_logs WHERE user_id = ? AND project_id IS NULL AND property_id = ?')
        .bind(ownerId, propId)
        .run();
    } catch (_) {}
  }

  if (gtmPublicId) {
    try {
      const otherGtm: any = await db
        .prepare(
          `SELECT COUNT(*) as cnt FROM projects
           WHERE user_id = ? AND id != ? AND gtm_container_public_id = ? AND (status IS NULL OR status = 'active')`
        )
        .bind(ownerId, projectId, gtmPublicId)
        .first();
      if ((otherGtm?.cnt || 0) === 0) {
        await db
          .prepare('DELETE FROM audit_logs WHERE user_id = ? AND project_id IS NULL AND gtm_id = ?')
          .bind(ownerId, gtmPublicId)
          .run();
      }
    } catch (_) {}
  }

  // Remove direct universal sharing grants
  try {
    await db.prepare('DELETE FROM project_access WHERE project_id = ?').bind(projectId).run();
  } catch (_) {}

  // Finally remove the project record
  await db.prepare('DELETE FROM projects WHERE id = ?').bind(projectId).run();
}

async function enrichProjectStats(
  db: any,
  project: any,
  sharedCountMap: Record<string, number>,
  meta?: { accessRole: AccessRole; accessSource: 'owner' | 'organization' | 'shared' }
) {
  const ownerId = project.user_id;
  const isTrashed = project.status === 'trashed';
  let monitorCount = 0;
  let alertCount = 0;
  let gtmAuditCount = 0;
  let ga4AuditCount = 0;
  let latestGtmScore: number | null = null;
  let latestGa4Score: number | null = null;

  try {
    const monSql = isTrashed
      ? `SELECT COUNT(*) as cnt FROM ga4_monitors
         WHERE user_id = ? AND (project_id = ? OR (project_id IS NULL AND ? != '' AND property_id = ?))`
      : `SELECT COUNT(*) as cnt FROM ga4_monitors
         WHERE user_id = ? AND (status IS NULL OR status = 'active')
           AND (project_id = ? OR (project_id IS NULL AND ? != '' AND property_id = ?))`;
    const monRow: any = await db
      .prepare(monSql)
      .bind(ownerId, project.id, project.ga4_property_id || '', project.ga4_property_id || '')
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
      .bind(ownerId, project.id, project.id)
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
        ownerId,
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
        ownerId,
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
      .bind(ownerId, project.id, project.ga4_property_id || '', project.ga4_property_id || '')
      .first();
    if (ga4Latest && typeof ga4Latest.health_score === 'number') {
      latestGa4Score = ga4Latest.health_score;
    }

    const ga4CountRow: any = await db
      .prepare(
        `SELECT COUNT(*) as cnt FROM ga4_audit_logs
         WHERE user_id = ? AND (project_id = ? OR (project_id IS NULL AND ? != '' AND property_id = ?))`
      )
      .bind(ownerId, project.id, project.ga4_property_id || '', project.ga4_property_id || '')
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
    latestGa4Score,
    sharedWithCount: sharedCountMap[project.id] || 0,
    accessRole: meta?.accessRole || 'owner',
    accessSource: meta?.accessSource || 'owner'
  };
}

export async function onRequest(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const jwtAuth = getClerkAuthContext(request);
  const queryUserId = url.searchParams.get('clerkUserId');

  const auth: ClerkAuthContext | null =
    jwtAuth ||
    (request.method === 'GET' && queryUserId && queryUserId !== 'undefined' && queryUserId !== 'null'
      ? { userId: queryUserId, orgId: null, orgRole: null, email: null }
      : null);

  if (!auth || !auth.userId || auth.userId === 'undefined' || auth.userId === 'null') {
    return json({ error: 'Unauthorized' }, 401);
  }

  const userId = auth.userId;

  try {
    await ensureUsersSchema(env.DB);
    await ensureMonitorsSchema(env.DB);
    await ensureAlertsSchema(env.DB);
    await ensureProjectsSchema(env.DB);

    const userEmail = auth.email || (await resolveUserEmail(env.DB, userId));
    auth.email = userEmail || auth.email;
    await claimPendingAccess(env.DB, userId, userEmail);

    if (request.method === 'GET') {
      const projectId = url.searchParams.get('id');
      if (projectId) {
        const access = await resolveProjectAccess(env.DB, auth, projectId, { allowTrashed: true });
        if (!access) {
          return json({ error: 'Project not found' }, 404);
        }
        let orgName: string | null = null;
        if (access.project.organization_id) {
          const oRow: any = await env.DB.prepare('SELECT name FROM organizations WHERE id = ?')
            .bind(access.project.organization_id)
            .first();
          orgName = oRow?.name || null;
        }
        let sharedCnt = 0;
        try {
          const sRow: any = await env.DB.prepare('SELECT COUNT(*) as cnt FROM project_access WHERE project_id = ?')
            .bind(projectId)
            .first();
          sharedCnt = sRow?.cnt || 0;
        } catch (_) {}
        const enriched = await enrichProjectStats(
          env.DB,
          { ...access.project, organization_name: orgName },
          { [projectId]: sharedCnt },
          { accessRole: access.role, accessSource: access.source }
        );
        return json({ project: enriched }, 200);
      }

      const orgFilter = url.searchParams.get('organizationId') || '';

      // 1. Owned projects
      const ownedRes = await env.DB.prepare(
        `SELECT p.*, o.name AS organization_name
         FROM projects p
         LEFT JOIN organizations o ON p.organization_id = o.id
         WHERE p.user_id = ?
         ORDER BY p.created_at DESC`
      )
        .bind(userId)
        .all();

      // 2. Organization-accessible projects (owner, member, or active Clerk org)
      const orgRes = await env.DB.prepare(
        `SELECT p.*, o.name AS organization_name,
                CASE
                  WHEN o.owner_user_id = ? THEN 'admin'
                  WHEN ? != '' AND o.clerk_org_id = ? THEN ?
                  ELSE COALESCE(om.role, 'editor')
                END AS resolved_org_role
         FROM projects p
         INNER JOIN organizations o ON p.organization_id = o.id
         LEFT JOIN organization_members om
           ON om.organization_id = o.id
          AND (om.user_id = ? OR (? != '' AND LOWER(om.email) = LOWER(?)))
         WHERE p.user_id != ?
           AND (
             o.owner_user_id = ?
             OR (? != '' AND o.clerk_org_id = ?)
             OR om.id IS NOT NULL
           )
         ORDER BY p.created_at DESC`
      )
        .bind(
          userId,
          auth.orgId || '',
          auth.orgId || '',
          auth.orgRole?.toLowerCase().includes('admin') ? 'admin' : 'editor',
          userId,
          userEmail,
          userEmail,
          userId,
          userId,
          auth.orgId || '',
          auth.orgId || ''
        )
        .all();

      // 3. Universal directly shared projects (project_access)
      const sharedRes = await env.DB.prepare(
        `SELECT p.*, o.name AS organization_name, pa.role AS shared_role
         FROM projects p
         INNER JOIN project_access pa ON pa.project_id = p.id
         LEFT JOIN organizations o ON p.organization_id = o.id
         WHERE p.user_id != ?
           AND (pa.granted_to_user_id = ? OR (? != '' AND LOWER(pa.granted_to_email) = LOWER(?)))
         ORDER BY p.created_at DESC`
      )
        .bind(userId, userId, userEmail, userEmail)
        .all();

      // Merge & deduplicate by highest access role
      const mergedMap = new Map<
        string,
        { row: any; accessRole: AccessRole; accessSource: 'owner' | 'organization' | 'shared' }
      >();

      for (const r of ownedRes.results || []) {
        mergedMap.set(r.id, { row: r, accessRole: 'owner', accessSource: 'owner' });
      }

      for (const r of orgRes.results || []) {
        const role = normalizeAccessRole(r.resolved_org_role);
        const existing = mergedMap.get(r.id);
        if (!existing || roleRank(role) > roleRank(existing.accessRole)) {
          mergedMap.set(r.id, { row: r, accessRole: role, accessSource: 'organization' });
        }
      }

      for (const r of sharedRes.results || []) {
        const role = normalizeAccessRole(r.shared_role);
        const existing = mergedMap.get(r.id);
        if (!existing || roleRank(role) > roleRank(existing.accessRole)) {
          mergedMap.set(r.id, { row: r, accessRole: role, accessSource: 'shared' });
        }
      }

      // Build sharedWithCount map in a single query
      const sharedCountMap: Record<string, number> = {};
      try {
        const cntRows = await env.DB.prepare(
          'SELECT project_id, COUNT(*) as cnt FROM project_access GROUP BY project_id'
        ).all();
        for (const cr of cntRows.results || []) {
          sharedCountMap[cr.project_id] = cr.cnt || 0;
        }
      } catch (_) {}

      let entries = Array.from(mergedMap.values());
      if (orgFilter && orgFilter !== 'all') {
        if (orgFilter === 'personal') {
          entries = entries.filter((e) => !e.row.organization_id && e.accessSource === 'owner');
        } else if (orgFilter === 'shared') {
          entries = entries.filter((e) => e.accessSource !== 'owner');
        } else {
          entries = entries.filter((e) => e.row.organization_id === orgFilter);
        }
      }

      const enrichedList = await Promise.all(
        entries.map((e) =>
          enrichProjectStats(env.DB, e.row, sharedCountMap, {
            accessRole: e.accessRole,
            accessSource: e.accessSource
          })
        )
      );

      const projects = enrichedList.filter((p) => p.status !== 'trashed');
      const trashedProjects = enrichedList
        .filter((p) => p.status === 'trashed' && canManageProject(p.accessRole))
        .sort((a, b) => {
          const da = new Date(a.deleted_at || a.updated_at || 0).getTime();
          const db = new Date(b.deleted_at || b.updated_at || 0).getTime();
          return db - da;
        });

      return json({ projects, trashedProjects }, 200);
    }

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const organizationId =
        typeof body.organizationId === 'string' && body.organizationId.trim()
          ? body.organizationId.trim()
          : null;

      let orgName: string | null = null;
      if (organizationId) {
        const orgAccess = await resolveOrganizationAccess(env.DB, auth, organizationId);
        if (!orgAccess || !canEditProject(orgAccess.role)) {
          return json({ error: 'You do not have permission to create projects in this organization.' }, 403);
        }
        orgName = orgAccess.organization.name;
      } else {
        const { tier } = await resolveUserTier(env.DB, userId);
        if (tier === 'free') {
          return json(
            {
              error:
                'An active paid subscription (Pro or Custom) is required to create projects. Please select a plan in Billing first.',
              requiresUpgrade: true
            },
            403
          );
        }
      }

      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) {
        return json({ error: 'Project name is required.' }, 400);
      }

      const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const websiteUrl = typeof body.websiteUrl === 'string' ? body.websiteUrl.trim() : '';
      const websiteType =
        typeof body.websiteType === 'string' && body.websiteType.trim() ? body.websiteType.trim() : 'general';

      await env.DB.prepare(
        `INSERT INTO projects (
          id, user_id, organization_id, name, website_url, website_type,
          gtm_account_id, gtm_account_name, gtm_container_id, gtm_container_name, gtm_container_public_id,
          gtm_workspace_id, gtm_workspace_name,
          ga4_property_id, ga4_property_name, measurement_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
      )
        .bind(
          projectId,
          userId,
          organizationId,
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
        )
        .run();

      const created: any = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first();
      const enriched = await enrichProjectStats(
        env.DB,
        { ...created, organization_name: orgName },
        {},
        { accessRole: 'owner', accessSource: 'owner' }
      );
      return json({ success: true, project: enriched }, 201);
    }

    if (request.method === 'PUT' || request.method === 'PATCH') {
      const body = await request.json().catch(() => ({}));
      const projectId = body.id || url.searchParams.get('id');
      if (!projectId) {
        return json({ error: 'Missing project id' }, 400);
      }

      const access = await resolveProjectAccess(env.DB, auth, projectId, { allowTrashed: true });
      if (!access) {
        return json({ error: 'Project not found' }, 404);
      }

      const existing = access.project;

      // Restore from Trash
      if (body.action === 'restore') {
        if (!canManageProject(access.role)) {
          return json({ error: 'Only project owners or admins can restore projects from trash.' }, 403);
        }

        await env.DB.prepare(
          "UPDATE projects SET status = 'active', deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
          .bind(projectId)
          .run();

        let restoredMonitorCount = 0;
        if (body.restoreMonitors !== false) {
          try {
            const mRes = await env.DB.prepare(
              "UPDATE ga4_monitors SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE project_id = ? AND status = 'trashed'"
            )
              .bind(projectId)
              .run();
            restoredMonitorCount += mRes?.meta?.changes || 0;
          } catch (_) {}

          if (existing.ga4_property_id) {
            try {
              const legacyRes = await env.DB.prepare(
                `UPDATE ga4_monitors
                 SET status = 'active', project_id = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = ? AND project_id IS NULL AND property_id = ? AND status = 'trashed'`
              )
                .bind(projectId, existing.user_id, existing.ga4_property_id)
                .run();
              restoredMonitorCount += legacyRes?.meta?.changes || 0;
            } catch (_) {}
          }
        }

        const updated: any = await env.DB.prepare(
          `SELECT p.*, o.name AS organization_name
           FROM projects p
           LEFT JOIN organizations o ON p.organization_id = o.id
           WHERE p.id = ?`
        )
          .bind(projectId)
          .first();
        const enriched = await enrichProjectStats(env.DB, updated, {}, { accessRole: access.role, accessSource: access.source });
        return json({ success: true, restored: true, restoredMonitors: restoredMonitorCount, project: enriched }, 200);
      }

      if (!canEditProject(access.role)) {
        return json({ error: 'Viewers cannot modify project settings.' }, 403);
      }

      let nextOrganizationId = existing.organization_id || null;
      if (body.organizationId !== undefined) {
        const targetOrgId =
          typeof body.organizationId === 'string' && body.organizationId.trim()
            ? body.organizationId.trim()
            : null;
        if (targetOrgId !== nextOrganizationId) {
          if (!canManageProject(access.role)) {
            return json({ error: 'Only project owners or admins can move projects between organizations.' }, 403);
          }
          if (targetOrgId) {
            const targetOrgAccess = await resolveOrganizationAccess(env.DB, auth, targetOrgId);
            if (!targetOrgAccess || !canEditProject(targetOrgAccess.role)) {
              return json({ error: 'You do not have permission on the target organization.' }, 403);
            }
          }
          nextOrganizationId = targetOrgId;
        }
      }

      const nextName = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : existing.name;
      const nextWebsiteUrl = body.websiteUrl !== undefined ? (body.websiteUrl || null) : existing.website_url;
      const nextWebsiteType = body.websiteType !== undefined ? (body.websiteType || 'general') : existing.website_type;

      await env.DB.prepare(
        `UPDATE projects SET
          name = ?,
          website_url = ?,
          website_type = ?,
          organization_id = ?,
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
         WHERE id = ?`
      )
        .bind(
          nextName,
          nextWebsiteUrl,
          nextWebsiteType,
          nextOrganizationId,
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
          projectId
        )
        .run();

      const updated: any = await env.DB.prepare(
        `SELECT p.*, o.name AS organization_name
         FROM projects p
         LEFT JOIN organizations o ON p.organization_id = o.id
         WHERE p.id = ?`
      )
        .bind(projectId)
        .first();
      const enriched = await enrichProjectStats(
        env.DB,
        updated,
        {},
        { accessRole: access.role, accessSource: access.source }
      );
      return json({ success: true, project: enriched }, 200);
    }

    if (request.method === 'DELETE') {
      const emptyTrash = url.searchParams.get('emptyTrash') === 'true';
      if (emptyTrash) {
        const orgFilter = url.searchParams.get('organizationId') || '';
        const trashedRows = await env.DB.prepare(
          "SELECT * FROM projects WHERE status = 'trashed'"
        ).all();

        let deletedCount = 0;
        for (const row of trashedRows.results || []) {
          if (orgFilter && orgFilter !== 'all') {
            if (orgFilter === 'personal' && row.organization_id) continue;
            if (orgFilter !== 'personal' && row.organization_id !== orgFilter) continue;
          }
          const access = await resolveProjectAccess(env.DB, auth, row.id, { allowTrashed: true });
          if (access && canManageProject(access.role)) {
            await permanentlyDeleteProjectCascade(env.DB, row);
            deletedCount++;
          }
        }
        return json({ success: true, deletedCount }, 200);
      }

      const projectId = url.searchParams.get('id');
      if (!projectId) {
        return json({ error: 'Missing project id' }, 400);
      }

      const access = await resolveProjectAccess(env.DB, auth, projectId, { allowTrashed: true });
      if (!access) {
        return json({ error: 'Project not found' }, 404);
      }
      if (!canManageProject(access.role)) {
        return json({ error: 'Only project owners or admins can delete projects.' }, 403);
      }

      const existing = access.project;
      const permanent = url.searchParams.get('permanent') === 'true';

      if (permanent) {
        await permanentlyDeleteProjectCascade(env.DB, existing);
        return json({ success: true, permanentlyDeleted: true }, 200);
      }

      // Soft-delete -> Move to Trash AND immediately close all associated monitors!
      await env.DB.prepare(
        "UPDATE projects SET status = 'trashed', deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
        .bind(projectId)
        .run();

      let closedMonitors = 0;
      try {
        const mRes = await env.DB.prepare(
          "UPDATE ga4_monitors SET status = 'trashed', updated_at = CURRENT_TIMESTAMP WHERE project_id = ? AND (status IS NULL OR status = 'active')"
        )
          .bind(projectId)
          .run();
        closedMonitors += mRes?.meta?.changes || 0;
      } catch (_) {}

      // If no other ACTIVE project by this owner references this GA4 property, also close legacy unscoped monitors!
      if (existing.ga4_property_id) {
        try {
          const otherActive: any = await env.DB.prepare(
            `SELECT COUNT(*) as cnt FROM projects
             WHERE user_id = ? AND id != ? AND ga4_property_id = ? AND (status IS NULL OR status = 'active')`
          )
            .bind(existing.user_id, projectId, existing.ga4_property_id)
            .first();

          if ((otherActive?.cnt || 0) === 0) {
            const legRes = await env.DB.prepare(
              `UPDATE ga4_monitors
               SET status = 'trashed', project_id = COALESCE(project_id, ?), updated_at = CURRENT_TIMESTAMP
               WHERE user_id = ? AND project_id IS NULL AND property_id = ? AND (status IS NULL OR status = 'active')`
            )
              .bind(projectId, existing.user_id, existing.ga4_property_id)
              .run();
            closedMonitors += legRes?.meta?.changes || 0;
          }
        } catch (_) {}
      }

      return json({ success: true, trashed: true, closedMonitors }, 200);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message || 'Internal server error' }, 500);
  }
}
