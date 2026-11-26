import {
  ensureUsersSchema,
  ensureProjectsSchema,
  getClerkAuthContext,
  resolveUserEmail,
  claimPendingAccess,
  resolveProjectAccess,
  canShareProject,
  canManageProject,
  normalizeAccessRole
} from './ga4/_shared';

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function sendAccessInviteEmail(
  env: any,
  recipientEmail: string,
  inviterEmail: string,
  projectNames: string[],
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

    const listText =
      projectNames.length <= 3
        ? projectNames.join(', ')
        : `${projectNames.slice(0, 3).join(', ')} (+${projectNames.length - 3} more)`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#0F172A; color:#F8FAFC; padding:28px; border-radius:12px; max-width:560px; margin:0 auto;">
        <h2 style="margin:0 0 8px; color:#00F0FF;">GTMObserver Project Access Granted</h2>
        <p style="margin:0 0 16px; color:#CBD5E1; line-height:1.5;">
          <strong>${inviterEmail || 'A teammate'}</strong> granted you <strong>${role.toUpperCase()}</strong> access to:
        </p>
        <div style="background:#1E293B; border:1px solid rgba(0,240,255,0.25); padding:14px 16px; border-radius:8px; margin-bottom:20px; color:#FFFFFF; font-weight:600;">
          ${listText}
        </div>
        <a href="https://app.gtmobserver.com/organization" style="display:inline-block; background:#00F0FF; color:#020617; font-weight:700; padding:11px 20px; border-radius:8px; text-decoration:none;">
          Open Organization Dashboard &rarr;
        </a>
        <p style="margin:20px 0 0; font-size:12px; color:#64748B;">
          Sign in with <strong>${recipientEmail}</strong> on app.gtmobserver.com to access your shared projects immediately.
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
        subject: `Access Granted: ${listText} on GTMObserver`,
        html
      })
    });
  } catch (_) {}
}

export async function onRequest(context: any) {
  const { env, request } = context;
  const auth = getClerkAuthContext(request);
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
      const projectId = (url.searchParams.get('projectId') || '').trim();

      if (projectId) {
        const access = await resolveProjectAccess(env.DB, auth, projectId, { allowTrashed: true });
        if (!access) {
          return json({ error: 'Project not found' }, 404);
        }

        const ownerRow: any = await env.DB.prepare('SELECT id, email FROM users WHERE id = ?')
          .bind(access.project.user_id)
          .first();

        const grantsRes = await env.DB.prepare(
          `SELECT pa.*, p.name AS project_name, p.website_url AS website_url, o.name AS organization_name
           FROM project_access pa
           INNER JOIN projects p ON pa.project_id = p.id
           LEFT JOIN organizations o ON p.organization_id = o.id
           WHERE pa.project_id = ?
           ORDER BY pa.created_at DESC`
        )
          .bind(projectId)
          .all();

        let orgMembers: any[] = [];
        if (access.project.organization_id) {
          const memRes = await env.DB.prepare(
            'SELECT id, organization_id, user_id, email, role, status, created_at FROM organization_members WHERE organization_id = ? ORDER BY created_at ASC'
          )
            .bind(access.project.organization_id)
            .all();
          orgMembers = memRes.results || [];
        }

        return json(
          {
            project: {
              id: access.project.id,
              name: access.project.name,
              organization_id: access.project.organization_id || null,
              accessRole: access.role
            },
            owner: ownerRow || { id: access.project.user_id, email: '' },
            orgMembers,
            grants: grantsRes.results || []
          },
          200
        );
      }

      // Universal Hub view: all grants on projects caller owns or admins + grants shared TO caller
      const manageableGrantsRes = await env.DB.prepare(
        `SELECT pa.*, p.name AS project_name, p.website_url AS website_url,
                p.organization_id AS organization_id, o.name AS organization_name
         FROM project_access pa
         INNER JOIN projects p ON pa.project_id = p.id
         LEFT JOIN organizations o ON p.organization_id = o.id
         LEFT JOIN organization_members om
           ON om.organization_id = o.id
          AND (om.user_id = ? OR (? != '' AND LOWER(om.email) = LOWER(?)))
         WHERE (p.status IS NULL OR p.status = 'active')
           AND (
             p.user_id = ?
             OR pa.granted_by_user_id = ?
             OR o.owner_user_id = ?
             OR om.role IN ('owner', 'admin')
           )
         ORDER BY pa.created_at DESC`
      )
        .bind(auth.userId, userEmail, userEmail, auth.userId, auth.userId, auth.userId)
        .all();

      const sharedWithMeRes = await env.DB.prepare(
        `SELECT pa.*, p.name AS project_name, p.website_url AS website_url,
                p.gtm_container_public_id, p.ga4_property_name,
                p.organization_id AS organization_id, o.name AS organization_name
         FROM project_access pa
         INNER JOIN projects p ON pa.project_id = p.id
         LEFT JOIN organizations o ON p.organization_id = o.id
         WHERE (p.status IS NULL OR p.status = 'active')
           AND p.user_id != ?
           AND (pa.granted_to_user_id = ? OR (? != '' AND LOWER(pa.granted_to_email) = LOWER(?)))
         ORDER BY pa.created_at DESC`
      )
        .bind(auth.userId, auth.userId, userEmail, userEmail)
        .all();

      return json(
        {
          grants: manageableGrantsRes.results || [],
          sharedWithMe: sharedWithMeRes.results || []
        },
        200
      );
    }

    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const rawProjectIds: string[] = Array.isArray(body.projectIds)
        ? body.projectIds
        : body.projectId
        ? [body.projectId]
        : [];
      const projectIds = Array.from(new Set(rawProjectIds.map((id) => String(id).trim()).filter(Boolean)));

      let emails: string[] = [];
      if (Array.isArray(body.emails)) {
        emails = body.emails;
      } else if (typeof body.email === 'string') {
        emails = body.email.split(/[,;\s]+/);
      }
      emails = Array.from(
        new Set(emails.map((e) => e.toLowerCase().trim()).filter((e) => e.includes('@')))
      );

      if (projectIds.length === 0 || emails.length === 0) {
        return json({ error: 'Select at least one project and enter at least one valid email address.' }, 400);
      }

      const rawRole = normalizeAccessRole(body.role || 'editor');
      const role = rawRole === 'owner' ? 'admin' : rawRole;
      const sendEmail = body.sendEmail !== false;

      const authorizedProjects: any[] = [];
      for (const pid of projectIds) {
        const access = await resolveProjectAccess(env.DB, auth, pid);
        if (!access) {
          return json({ error: `Project not found: ${pid}` }, 404);
        }
        if (!canShareProject(access.role)) {
          return json({ error: `You do not have permission to share "${access.project.name}".` }, 403);
        }
        authorizedProjects.push(access.project);
      }

      let grantedCount = 0;
      for (const email of emails) {
        const targetUser: any = await env.DB.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1')
          .bind(email)
          .first();

        for (const proj of authorizedProjects) {
          const grantId = 'pa_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
          await env.DB.prepare(
            `INSERT INTO project_access
               (id, project_id, granted_to_user_id, granted_to_email, role, granted_by_user_id, granted_by_email)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(project_id, granted_to_email) DO UPDATE SET
               role = excluded.role,
               granted_to_user_id = COALESCE(excluded.granted_to_user_id, project_access.granted_to_user_id),
               granted_by_user_id = excluded.granted_by_user_id,
               granted_by_email = excluded.granted_by_email,
               updated_at = CURRENT_TIMESTAMP`
          )
            .bind(grantId, proj.id, targetUser?.id || null, email, role, auth.userId, userEmail || null)
            .run();
          grantedCount++;
        }

        if (sendEmail && email !== userEmail) {
          await sendAccessInviteEmail(
            env,
            email,
            userEmail,
            authorizedProjects.map((p) => p.name),
            role
          );
        }
      }

      return json({ success: true, grantedCount, projectCount: authorizedProjects.length, emails }, 201);
    }

    if (request.method === 'PATCH') {
      const body = await request.json().catch(() => ({}));
      const grantId = body.id;
      if (!grantId) return json({ error: 'Missing grant id' }, 400);

      const grant: any = await env.DB.prepare('SELECT * FROM project_access WHERE id = ?').bind(grantId).first();
      if (!grant) return json({ error: 'Access grant not found' }, 404);

      const access = await resolveProjectAccess(env.DB, auth, grant.project_id);
      if (!access || !canShareProject(access.role)) {
        return json({ error: 'You do not have permission to update this grant.' }, 403);
      }

      const rawRole = normalizeAccessRole(body.role);
      const safeRole = rawRole === 'owner' ? 'admin' : rawRole;

      await env.DB.prepare('UPDATE project_access SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(safeRole, grantId)
        .run();

      return json({ success: true, role: safeRole }, 200);
    }

    if (request.method === 'DELETE') {
      const grantId = url.searchParams.get('id');
      if (!grantId) return json({ error: 'Missing grant id' }, 400);

      const grant: any = await env.DB.prepare('SELECT * FROM project_access WHERE id = ?').bind(grantId).first();
      if (!grant) return json({ error: 'Access grant not found' }, 404);

      const isSelfRecipient =
        grant.granted_to_user_id === auth.userId ||
        (userEmail && grant.granted_to_email?.toLowerCase() === userEmail);

      if (!isSelfRecipient) {
        const access = await resolveProjectAccess(env.DB, auth, grant.project_id, { allowTrashed: true });
        if (!access || (!canManageProject(access.role) && grant.granted_by_user_id !== auth.userId)) {
          return json({ error: 'You do not have permission to revoke this grant.' }, 403);
        }
      }

      await env.DB.prepare('DELETE FROM project_access WHERE id = ?').bind(grantId).run();
      return json({ success: true }, 200);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (err: any) {
    return json({ error: err.message || 'Internal server error' }, 500);
  }
}
