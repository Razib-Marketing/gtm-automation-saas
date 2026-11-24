import type { Context } from 'hono';
import type { WorkerBindings } from '../_types';
import { renderPdfFromHtml, sanitizeFilename } from '../_pdf';
import { buildGtmAuditPdfHtml } from '../_pdfTemplates';
import { ensureProjectsSchema, getClerkUserId } from '../ga4/_shared';

export async function handleGtmAuditPdf(
  c: Context<{ Bindings: WorkerBindings }>
): Promise<Response> {
  const userId = getClerkUserId(c.req.raw);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const auditId = (c.req.param('auditId') || '').trim();
  if (!auditId) {
    return c.json({ error: 'Missing auditId' }, 400);
  }

  const requestedProjectId = (c.req.query('projectId') || '').trim();

  if (!c.env.DB) {
    return c.json({ error: 'Database binding is not configured' }, 503);
  }

  if (!c.env.BROWSER) {
    return c.json({ error: 'Cloudflare Browser Run binding is not configured' }, 503);
  }

  try {
    await ensureProjectsSchema(c.env.DB);

    const row: any = await c.env.DB.prepare(
      `SELECT
         a.id,
         a.user_id,
         a.project_id,
         a.gtm_id,
         a.health_score,
         a.issue_count,
         a.raw_data,
         a.created_at,
         p.id AS owned_project_id,
         p.name AS project_name,
         p.website_url AS website_url,
         p.gtm_container_name AS gtm_container_name,
         p.gtm_workspace_name AS gtm_workspace_name
       FROM audit_logs a
       LEFT JOIN projects p ON a.project_id = p.id AND p.user_id = a.user_id
       WHERE a.id = ? AND a.user_id = ?
       LIMIT 1`
    )
      .bind(auditId, userId)
      .first();

    if (!row) {
      return c.json({ error: 'GTM audit report not found' }, 404);
    }

    if (row.project_id && !row.owned_project_id) {
      return c.json({ error: 'GTM audit report not found' }, 404);
    }

    if (requestedProjectId && row.project_id && row.project_id !== requestedProjectId) {
      return c.json({ error: 'GTM audit report does not belong to this project' }, 404);
    }

    let parsedRaw: any = {};
    try {
      parsedRaw = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data || {};
    } catch (_) {}

    const bodyHtml = buildGtmAuditPdfHtml({
      auditId: row.id,
      gtmId: row.gtm_id,
      projectName: row.project_name || null,
      websiteUrl: row.website_url || null,
      gtmContainerName: row.gtm_container_name || null,
      gtmWorkspaceName: row.gtm_workspace_name || null,
      healthScore: Number(row.health_score ?? 100),
      issueCount: row.issue_count,
      createdAt: row.created_at,
      rawData: parsedRaw
    });

    const pdfRes = await renderPdfFromHtml(c.env.BROWSER, {
      title: `GTM Audit: ${row.gtm_id || 'Workspace'}`,
      subtitle: row.project_name ? `Project: ${row.project_name}` : row.id,
      bodyHtml
    });

    const safeFileId = sanitizeFilename(auditId, 'audit');
    return new Response(pdfRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="gtm-audit-${safeFileId}.pdf"`,
        'Cache-Control': 'private, no-store'
      }
    });
  } catch (err: any) {
    console.error('GTM PDF generation failed:', err?.message || err);
    return c.json({ error: err?.message || 'Failed to generate GTM audit PDF' }, 500);
  }
}
