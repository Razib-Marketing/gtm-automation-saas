import type { Context } from 'hono';
import type { WorkerBindings } from '../_types';
import { renderPdfFromHtml, sanitizeFilename } from '../_pdf';
import { buildGa4AuditPdfHtml } from '../_pdfTemplates';
import { ensureProjectsSchema, verifyClerkAuth, resolveProjectAccess } from './_shared';

export async function handleGa4AuditPdf(
  c: Context<{ Bindings: WorkerBindings }>
): Promise<Response> {
  const auth = await verifyClerkAuth(c.req.raw, c.env);
  if (!auth) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const userId = auth.userId;

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
         a.property_id,
         a.property_name,
         a.health_score,
         a.critical_count,
         a.warning_count,
         a.passed_count,
         a.raw_data,
         a.created_at,
         p.name AS project_name,
         p.website_url AS website_url
       FROM ga4_audit_logs a
       LEFT JOIN projects p ON a.project_id = p.id
       WHERE a.id = ?
       LIMIT 1`
    )
      .bind(auditId)
      .first();

    if (!row) {
      return c.json({ error: 'GA4 audit report not found' }, 404);
    }

    const effectiveProjectId = row.project_id || requestedProjectId;
    if (effectiveProjectId) {
      const access = await resolveProjectAccess(c.env.DB, auth, effectiveProjectId);
      if (!access) {
        return c.json({ error: 'GA4 audit report not found' }, 404);
      }
    } else if (row.user_id !== userId) {
      return c.json({ error: 'GA4 audit report not found' }, 404);
    }

    if (requestedProjectId && row.project_id && row.project_id !== requestedProjectId) {
      return c.json({ error: 'GA4 audit report does not belong to this project' }, 404);
    }

    let parsedReport: any = {};
    try {
      parsedReport = typeof row.raw_data === 'string' ? JSON.parse(row.raw_data) : row.raw_data || {};
    } catch (_) {}

    const propertyDisplayName =
      row.property_name || parsedReport?.propertyMeta?.displayName || row.property_id || 'GA4 Property';
    const bodyHtml = buildGa4AuditPdfHtml({
      auditId: row.id,
      propertyId: row.property_id,
      propertyName: propertyDisplayName,
      projectName: row.project_name || null,
      websiteUrl: row.website_url || parsedReport?.propertyMeta?.defaultUri || null,
      healthScore: Number(row.health_score ?? parsedReport?.healthScore ?? 0),
      criticalCount: row.critical_count,
      warningCount: row.warning_count,
      passedCount: row.passed_count,
      createdAt: row.created_at,
      report: parsedReport
    });

    const pdfRes = await renderPdfFromHtml(c.env.BROWSER, {
      title: `GA4 Audit: ${propertyDisplayName}`,
      subtitle: row.project_name ? `Project: ${row.project_name}` : row.property_id || row.id,
      bodyHtml
    });

    const safeFileId = sanitizeFilename(auditId, 'audit');
    return new Response(pdfRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ga4-audit-${safeFileId}.pdf"`,
        'Cache-Control': 'private, no-store'
      }
    });
  } catch (err: any) {
    console.error('GA4 PDF generation failed:', err?.message || err);
    return c.json({ error: err?.message || 'Failed to generate GA4 audit PDF' }, 500);
  }
}
