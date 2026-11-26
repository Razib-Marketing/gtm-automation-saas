import {
  ensureUsersSchema,
  ensureProjectsSchema,
  verifyClerkAuth,
  resolveUserEmail,
  claimPendingAccess,
  resolveOrganizationAccess,
  canManageProject,
  canEditProject,
  normalizeAccessRole,
  roleRank,
  AccessRole
} from './ga4/_shared';
import { escapeHtml, isValidEmail } from './_security';

async function sendOrgMemberInviteEmail(
  env: any,
  recipientEmail: string,
  inviterEmail: string,
  orgName: string,
  orgId: string,
  role: string
) {
  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) return;
  try {
    let senderEmail = 'onboarding@resend.dev';
    try {
      const domRes = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${resendApiKey}` }
      });
      if (domRes.ok) {
        const domData: any = await domRes.json();
        const verified = domData.data?.find((d: any) => d.status === 'verified');
        if (verified) senderEmail = `alerts@${verified.name}`;
      }
    } catch (_) {}

    const safeOrg = escapeHtml(orgName);
    const safeInviter = escapeHtml(inviterEmail || 'An administrator');
    const safeRecipient = escapeHtml(recipientEmail);
    const safeRole = escapeHtml(role.toUpperCase());

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#0F172A; color:#F8FAFC; padding:28px; border-radius:12px; max-width:560px; margin:0 auto;">
        <h2 style="margin:0 0 8px; color:#00F0FF;">GTMObserver Organization Access Granted</h2>
        <p style="margin:0 0 16px; color:#CBD5E1; line-height:1.5;">
          <strong>${safeInviter}</strong> added you to <strong>${safeOrg}</strong> with <strong>${safeRole}</strong> access across all organization websites.
        </p>
        <a href="https://app.gtmobserver.com/organizations/${encodeURIComponent(orgId)}" style="display:inline-block; background:#00F0FF; color:#020617; font-weight:700; padding:11px 20px; border-radius:8px; text-decoration:none;">
          Open ${safeOrg} Dashboard &rarr;
        </a>
        <p style="margin:20px 0 0; font-size:12px; color:#64748B;">
          Sign in with <strong>${safeRecipient}</strong> on app.gtmobserver.com to access your organization workspace.
        </p>
      </div>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `GTMObserver <${senderEmail}>`,
        to: [recipientEmail],
        subject: `Organization Access Granted: ${orgName} on GTMObserver`,
        html
      })
    });
  } catch (_) {}
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function onRequest(context: any) {
  const { env, request } = context;
  const auth = await verifyClerkAuth(request, env);
  if (!auth) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    await ensureUsersSchema(env.DB);
    await ensureProjectsSchema(env.DB);

    const userEmail = auth.email || (await resolveUserEmail(env.DB, auth.userId));
    auth.email = userEmail || auth.email;
    await claimPendingAccess(env.DB, auth.userId, userEmail);

    const url = new URL(request.url);

    if (request.method === 'GET') {
      const clerkOrgNameParam = (url.searchParams.get('clerkOrgName') || '').trim();

      // Auto-sync active Clerk Organization into our D1 mirror so Clerk orgs seamlessly hold projects
      if (auth.orgId) {
        const existingMirror: any = await env.DB.prepare(
          'SELECT id, name FROM organizations WHERE clerk_org_id = ? LIMIT 1'
        )
          .bind(auth.orgId)
          .first();

        if (!existingMirror) {
          const newOrgId = 'org_clk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
          const resolvedName = clerkOrgNameParam || 'Clerk Organization';
          await env.DB.prepare(
            `INSERT INTO organizations (id, clerk_org_id, name, slug, description, owner_user_id)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
            .bind(
              newOrgId,
              auth.orgId,
              resolvedName,
              slugify(resolvedName) || newOrgId,
              'Synced from active Clerk Organization',
              auth.userId
            )
            .run();

          if (userEmail) {
            const memId = 'om_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
            const role: AccessRole = auth.orgRole?.toLowerCase().includes('admin') ? 'owner' : 'editor';
            await env.DB.prepare(
              `INSERT OR IGNORE INTO organization_members (id, organization_id, user_id, email, role, invited_by, status)
               VALUES (?, ?, ?, ?, ?, ?, 'active')`
            )
              .bind(memId, newOrgId, auth.userId, userEmail, role, auth.userId)
              .run();
          }
        } else if (clerkOrgNameParam && existingMirror.name !== clerkOrgNameParam) {
          await env.DB.prepare('UPDATE organizations SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .bind(clerkOrgNameParam, existingMirror.id)
            .run();
        }
      }

      const ownedOrgs = await env.DB.prepare(
        'SELECT * FROM organizations WHERE owner_user_id = ? ORDER BY created_at DESC'
      )
        .bind(auth.userId)
        .all();

      const memberOrgs = await env.DB.prepare(
        `SELECT o.*, om.role AS member_role
         FROM organizations o
         INNER JOIN organization_members om ON om.organization_id = o.id
         WHERE om.user_id = ? OR (? != '' AND LOWER(om.email) = LOWER(?))
         ORDER BY o.created_at DESC`
      )
        .bind(auth.userId, userEmail, userEmail)
        .all();

      const clerkOrgs = auth.orgId
        ? await env.DB.prepare('SELECT * FROM organizations WHERE clerk_org_id = ?')
            .bind(auth.orgId)
            .all()
        : { results: [] };

      const orgMap = new Map<string, { org: any; role: AccessRole }>();

      for (const o of ownedOrgs.results || []) {
        orgMap.set(o.id, { org: o, role: 'owner' });
      }
      for (const o of memberOrgs.results || []) {
        const r = normalizeAccessRole(o.member_role);
        const existing = orgMap.get(o.id);
        if (!existing || roleRank(r) > roleRank(existing.role)) {
          orgMap.set(o.id, { org: o, role: r });
        }
      }
      for (const o of clerkOrgs.results || []) {
        const r: AccessRole = auth.orgRole?.toLowerCase().includes('admin') ? 'admin' : 'editor';
        const existing = orgMap.get(o.id);
        if (!existing || roleRank(r) > roleRank(existing.role)) {
          orgMap.set(o.id, { org: o, role: r });
        }
      }

      const organizations = await Promise.all(
        Array.from(orgMap.values()).map(async ({ org, role }) => {
          const [projCounts, memRows]: any[] = await Promise.all([
            env.DB.prepare(
              `SELECT
                 SUM(CASE WHEN status IS NULL OR status = 'active' THEN 1 ELSE 0 END) AS active_cnt,
                 SUM(CASE WHEN status = 'trashed' THEN 1 ELSE 0 END) AS trashed_cnt
               FROM projects WHERE organization_id = ?`
            )
              .bind(org.id)
              .first(),
            env.DB.prepare(
              'SELECT id, organization_id, user_id, email, role, status, created_at FROM organization_members WHERE organization_id = ? ORDER BY created_at ASC'
            )
              .bind(org.id)
              .all()
          ]);

          return {
            ...org,
            role,
            projectCount: projCounts?.active_cnt || 0,
            trashedCount: projCounts?.trashed_cnt || 0,
            memberCount: (memRows?.results || []).length,
            members: memRows?.results || []
          };
        })
      );

      return json({ organizations }, 200);
    }

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) {
        return json({ error: 'Organization name is required.' }, 400);
      }

      const description = typeof body.description === 'string' ? body.description.trim() : '';
      const clerkOrgId = typeof body.clerkOrgId === 'string' && body.clerkOrgId.trim() ? body.clerkOrgId.trim() : null;
      if (!clerkOrgId) {
        return json({ error: 'Organizations must be created through the organization switcher.' }, 400);
      }
      const orgId = 'org_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

      await env.DB.prepare(
        `INSERT INTO organizations (id, clerk_org_id, name, slug, description, owner_user_id)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
        .bind(orgId, clerkOrgId, name, slugify(name) || orgId, description || null, auth.userId)
        .run();

      if (userEmail) {
        const memId = 'om_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        await env.DB.prepare(
          `INSERT OR IGNORE INTO organization_members (id, organization_id, user_id, email, role, invited_by, status)
           VALUES (?, ?, ?, ?, 'owner', ?, 'active')`
        )
          .bind(memId, orgId, auth.userId, userEmail, auth.userId)
          .run();
      }

      const created = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(orgId).first();
      return json(
        {
          success: true,
          organization: {
            ...created,
            role: 'owner',
            projectCount: 0,
            trashedCount: 0,
            memberCount: userEmail ? 1 : 0,
            members: []
          }
        },
        201
      );
    }

    if (request.method === 'PATCH' || request.method === 'PUT') {
      const body = await request.json().catch(() => ({}));
      const action = body.action || 'update';

      // Bulk assign multiple projects to an organization (or Personal = null)
      if (action === 'assign_projects') {
        const projectIds: string[] = Array.isArray(body.projectIds) ? body.projectIds.filter(Boolean) : [];
        const targetOrgId =
          typeof body.organizationId === 'string' && body.organizationId.trim()
            ? body.organizationId.trim()
            : null;

        if (projectIds.length === 0) {
          return json({ error: 'Select at least one project to assign.' }, 400);
        }

        if (targetOrgId) {
          const orgAccess = await resolveOrganizationAccess(env.DB, auth, targetOrgId);
          if (!orgAccess || !canEditProject(orgAccess.role)) {
            return json({ error: 'You do not have permission on the target organization.' }, 403);
          }
        }

        let updatedCount = 0;
        for (const pid of projectIds) {
          const pRow: any = await env.DB.prepare('SELECT id, user_id, organization_id FROM projects WHERE id = ?')
            .bind(pid)
            .first();
          if (!pRow) continue;
          const isOwner = pRow.user_id === auth.userId;
          let canMove = isOwner;
          if (!canMove && pRow.organization_id) {
            const curOrgAcc = await resolveOrganizationAccess(env.DB, auth, pRow.organization_id);
            if (curOrgAcc && canManageProject(curOrgAcc.role)) canMove = true;
          }
          if (canMove) {
            await env.DB.prepare(
              'UPDATE projects SET organization_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            )
              .bind(targetOrgId, pid)
              .run();
            updatedCount++;
          }
        }

        return json({ success: true, updatedCount }, 200);
      }

      const orgId = body.id || body.organizationId || url.searchParams.get('id');
      if (!orgId) {
        return json({ error: 'Missing organization id' }, 400);
      }

      const access = await resolveOrganizationAccess(env.DB, auth, orgId);
      if (!access) {
        return json({ error: 'Organization not found' }, 404);
      }
      if (!canManageProject(access.role)) {
        return json({ error: 'Only organization owners or admins can perform this action.' }, 403);
      }

      if (action === 'add_member') {
        const rawEmail = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
        if (!isValidEmail(rawEmail)) {
          return json({ error: 'Valid member email is required.' }, 400);
        }
        const role = normalizeAccessRole(body.role || 'editor');
        const safeRole = role === 'owner' ? 'admin' : role;

        const userRow: any = await env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1')
          .bind(rawEmail)
          .first();

        const memId = 'om_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        await env.DB.prepare(
          `INSERT INTO organization_members (id, organization_id, user_id, email, role, invited_by, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(organization_id, email) DO UPDATE SET
             role = excluded.role,
             user_id = COALESCE(excluded.user_id, organization_members.user_id)`
        )
          .bind(memId, orgId, userRow?.id || null, rawEmail, safeRole, auth.userId, userRow?.id ? 'active' : 'invited')
          .run();

        if (rawEmail !== userEmail) {
          await sendOrgMemberInviteEmail(
            env,
            rawEmail,
            userEmail,
            access.organization.name,
            orgId,
            safeRole
          );
        }

        const memRows = await env.DB.prepare(
          'SELECT id, organization_id, user_id, email, role, status, created_at FROM organization_members WHERE organization_id = ? ORDER BY created_at ASC'
        )
          .bind(orgId)
          .all();

        return json({ success: true, members: memRows.results || [] }, 200);
      }

      if (action === 'update_member') {
        const memberId = body.memberId;
        const nextRole = normalizeAccessRole(body.role);
        if (!memberId) return json({ error: 'Missing memberId' }, 400);
        const safeRole = nextRole === 'owner' ? 'admin' : nextRole;
        await env.DB.prepare(
          'UPDATE organization_members SET role = ? WHERE id = ? AND organization_id = ?'
        )
          .bind(safeRole, memberId, orgId)
          .run();
        const memRows = await env.DB.prepare(
          'SELECT id, organization_id, user_id, email, role, status, created_at FROM organization_members WHERE organization_id = ? ORDER BY created_at ASC'
        )
          .bind(orgId)
          .all();
        return json({ success: true, members: memRows.results || [] }, 200);
      }

      if (action === 'remove_member') {
        const memberId = body.memberId;
        if (!memberId) return json({ error: 'Missing memberId' }, 400);
        await env.DB.prepare(
          "DELETE FROM organization_members WHERE id = ? AND organization_id = ? AND role != 'owner'"
        )
          .bind(memberId, orgId)
          .run();
        const memRows = await env.DB.prepare(
          'SELECT id, organization_id, user_id, email, role, status, created_at FROM organization_members WHERE organization_id = ? ORDER BY created_at ASC'
        )
          .bind(orgId)
          .all();
        return json({ success: true, members: memRows.results || [] }, 200);
      }

      // Default: update organization name / description / clerkOrgId
      const nextName = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : access.organization.name;
      const nextDesc = body.description !== undefined ? (body.description || null) : access.organization.description;
      const nextClerkOrgId =
        body.clerkOrgId !== undefined ? (body.clerkOrgId || null) : access.organization.clerk_org_id;

      await env.DB.prepare(
        `UPDATE organizations
         SET name = ?, slug = ?, description = ?, clerk_org_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
        .bind(nextName, slugify(nextName) || orgId, nextDesc, nextClerkOrgId, orgId)
        .run();

      const updated = await env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(orgId).first();
      return json({ success: true, organization: updated }, 200);
    }

    if (request.method === 'DELETE') {
      const orgId = url.searchParams.get('id');
      if (!orgId) return json({ error: 'Missing organization id' }, 400);

      const access = await resolveOrganizationAccess(env.DB, auth, orgId);
      if (!access) return json({ error: 'Organization not found' }, 404);
      if (!canManageProject(access.role)) {
        return json({ error: 'Only organization owners or admins can delete an organization.' }, 403);
      }

      // Safely unassign projects back to Personal Workspace rather than deleting user websites!
      await env.DB.prepare(
        'UPDATE projects SET organization_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE organization_id = ?'
      )
        .bind(orgId)
        .run();
      await env.DB.prepare('DELETE FROM organization_members WHERE organization_id = ?').bind(orgId).run();
      await env.DB.prepare('DELETE FROM organizations WHERE id = ?').bind(orgId).run();

      return json({ success: true }, 200);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message || 'Internal server error' }, 500);
  }
}
