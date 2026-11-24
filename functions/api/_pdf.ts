export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeFilename(value: string, fallback = 'report'): string {
  const cleaned = (value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
  return cleaned || fallback;
}

export async function responseToBase64(res: Response): Promise<string> {
  const bytes = new Uint8Array(await res.arrayBuffer());
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function renderPdfFromHtml(
  browser: BrowserRun,
  options: { title: string; subtitle: string; bodyHtml: string }
): Promise<Response> {
  if (!browser || typeof browser.quickAction !== 'function') {
    throw new Error('Cloudflare Browser Run binding (BROWSER) is not available');
  }

  const safeTitle = escapeHtml(options.title);
  const safeSubtitle = escapeHtml(options.subtitle);
  const generatedStamp = escapeHtml(new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC');

  const headerTemplate = `
    <div style="width:100%;padding:0 14mm;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-print-color-adjust:exact;box-sizing:border-box;">
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #CBD5E1;padding-bottom:6px;width:100%;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#00C8D6;"></span>
          <span style="font-size:9px;font-weight:800;color:#0F172A;letter-spacing:0.04em;text-transform:uppercase;">GTMObserver</span>
          <span style="font-size:9px;color:#64748B;">|</span>
          <span style="font-size:9px;font-weight:600;color:#334155;">${safeTitle}</span>
        </div>
        <div style="font-size:8px;color:#64748B;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${safeSubtitle}</div>
      </div>
    </div>
  `.trim();

  const footerTemplate = `
    <div style="width:100%;padding:0 14mm;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-print-color-adjust:exact;box-sizing:border-box;">
      <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid #E2E8F0;padding-top:6px;font-size:8px;color:#64748B;width:100%;">
        <span>Generated ${generatedStamp} • Confidential Analytics Audit</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    </div>
  `.trim();

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 24mm 14mm 20mm 14mm;
    }
    * {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      font-size: 11px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .report-hero {
      background: linear-gradient(135deg, #0B0F19 0%, #111827 100%);
      color: #F8FAFC;
      border-radius: 10px;
      padding: 16px 18px;
      margin-bottom: 14px;
      border-left: 5px solid #00F0FF;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .hero-brand {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #00F0FF;
      margin-bottom: 4px;
    }
    .hero-title {
      font-size: 18px;
      font-weight: 800;
      color: #FFFFFF;
      margin: 0 0 4px 0;
    }
    .hero-sub {
      font-size: 10.5px;
      color: #CBD5E1;
      margin: 0;
    }
    .score-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 10px;
      padding: 8px 12px;
      flex-shrink: 0;
    }
    .grade-pill {
      display: inline-block;
      margin-top: 3px;
      padding: 2px 7px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 14px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .meta-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 8px 10px;
    }
    .meta-label {
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748B;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .meta-value {
      font-size: 10.5px;
      font-weight: 700;
      color: #0F172A;
      word-break: break-word;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 14px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .kpi-card {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 10px 10px;
    }
    .kpi-label {
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #64748B;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .kpi-val {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.1;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 14px 0 8px 0;
      padding-bottom: 4px;
      border-bottom: 2px solid #E2E8F0;
    }
    .chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #E2E8F0;
      background: #F8FAFC;
      font-size: 9.5px;
      font-weight: 600;
      color: #1E293B;
    }
    table.audit-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10px;
    }
    table.audit-table thead th {
      background: #0F172A;
      color: #F8FAFC;
      text-align: left;
      padding: 7px 8px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 700;
    }
    table.audit-table tbody tr {
      border-bottom: 1px solid #E2E8F0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    table.audit-table tbody tr:nth-child(even) {
      background: #F8FAFC;
    }
    table.audit-table td {
      padding: 7px 8px;
      vertical-align: top;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 9999px;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      white-space: nowrap;
    }
    .badge-critical { background: #FEF2F2; color: #B91C1C; border: 1px solid #FCA5A5; }
    .badge-warning { background: #FFFBEB; color: #B45309; border: 1px solid #FCD34D; }
    .badge-info { background: #EFF6FF; color: #1D4ED8; border: 1px solid #93C5FD; }
    .badge-passed { background: #ECFDF5; color: #047857; border: 1px solid #6EE7B7; }
    .evidence-list {
      margin: 4px 0 0 0;
      padding-left: 14px;
      color: #475569;
      font-size: 9.2px;
    }
    .fix-note {
      margin-top: 4px;
      padding: 4px 7px;
      border-left: 3px solid #00C8D6;
      background: #F0FDFF;
      color: #0F172A;
      font-size: 9.2px;
    }
    .issue-card {
      border: 1px solid #E2E8F0;
      border-left: 4px solid #EF4444;
      background: #FFFFFF;
      border-radius: 7px;
      padding: 9px 11px;
      margin-bottom: 8px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .issue-card.moderate {
      border-left-color: #F59E0B;
    }
    .issue-card.passed {
      border-left-color: #10B981;
      background: #F0FDF4;
    }
  </style>
</head>
<body>
${options.bodyHtml}
</body>
</html>`;

  const pdfRes = await browser.quickAction('pdf', {
    html: fullHtml,
    rejectRequestPattern: ['/^https?:\\/\\//'],
    pdfOptions: {
      format: 'a4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {
        top: '24mm',
        right: '14mm',
        bottom: '20mm',
        left: '14mm'
      }
    }
  });

  if (!pdfRes.ok) {
    const errText = await pdfRes.text().catch(() => '');
    throw new Error(`Browser Run PDF generation failed (HTTP ${pdfRes.status}): ${errText.slice(0, 300)}`);
  }

  return new Response(pdfRes.body, {
    status: 200,
    headers: { 'Content-Type': 'application/pdf' }
  });
}
