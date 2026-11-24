import { escapeHtml } from './_pdf';
import type { EvaluatedCondition } from './ga4/_shared';

function buildScoreGaugeSvg(score: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const color = clamped >= 90 ? '#22C55E' : clamped >= 70 ? '#F59E0B' : '#EF4444';
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="Health score ${clamped}">
    <circle cx="32" cy="32" r="${radius}" fill="none" stroke="#334155" stroke-width="6" />
    <circle cx="32" cy="32" r="${radius}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${dashOffset.toFixed(2)}"
      transform="rotate(-90 32 32)" />
    <text x="32" y="36" text-anchor="middle" fill="#FFFFFF" font-size="16" font-weight="800" font-family="Arial, sans-serif">${clamped}</text>
  </svg>`;
}

function getScoreBadge(score: number): { label: string; bg: string; fg: string } {
  if (score >= 90) return { label: 'Excellent', bg: 'rgba(34,197,94,0.2)', fg: '#86EFAC' };
  if (score >= 70) return { label: 'Good / Review', bg: 'rgba(245,158,11,0.2)', fg: '#FCD34D' };
  return { label: 'Critical Attention', bg: 'rgba(239,68,68,0.25)', fg: '#FCA5A5' };
}

function formatNum(value: unknown, decimals = 0): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function getSeverityBadge(severity: string): string {
  const s = (severity || '').toLowerCase();
  if (s === 'critical') return '<span class="badge badge-critical">Critical</span>';
  if (s === 'warning') return '<span class="badge badge-warning">Warning</span>';
  if (s === 'passed') return '<span class="badge badge-passed">Passed</span>';
  return '<span class="badge badge-info">Info</span>';
}

export interface Ga4AuditPdfParams {
  auditId: string;
  propertyId: string;
  propertyName?: string | null;
  projectName?: string | null;
  websiteUrl?: string | null;
  healthScore: number;
  criticalCount?: number;
  warningCount?: number;
  passedCount?: number;
  createdAt?: string | null;
  report: any;
}

export function buildGa4AuditPdfHtml(params: Ga4AuditPdfParams): string {
  const report = params.report || {};
  const meta = report.propertyMeta || {};
  const totals = meta.totals30d || {};
  const summary = report.summary || {};
  const findings: any[] = Array.isArray(report.findings) ? report.findings : [];
  const integrations: any[] = Array.isArray(report.integrations) ? report.integrations : [];

  const score = Number.isFinite(params.healthScore) ? params.healthScore : Number(report.healthScore || 0);
  const badge = getScoreBadge(score);
  const criticalCount = params.criticalCount ?? summary.criticalCount ?? findings.filter(f => f.severity === 'critical').length;
  const warningCount = params.warningCount ?? summary.warningCount ?? findings.filter(f => f.severity === 'warning' || f.severity === 'info').length;
  const passedCount = params.passedCount ?? summary.passedCount ?? findings.filter(f => f.severity === 'passed').length;

  const displayName = params.propertyName || meta.displayName || params.propertyId || 'GA4 Property';
  const subParts = [
    params.projectName ? `Project: ${params.projectName}` : '',
    params.websiteUrl || meta.defaultUri || '',
    meta.measurementId || params.propertyId
  ].filter(Boolean);

  const integrationsHtml = integrations.length
    ? `<div class="section-title">Platform Integrations &amp; Connections</div>
       <div class="chips-wrap">
         ${integrations.map(intg => {
           const status = (intg.status || '').toLowerCase();
           const badgeCls = status === 'linked' ? 'badge-passed' : status === 'missing' ? 'badge-warning' : 'badge-info';
           const statusText = status === 'linked' ? 'Linked' : status === 'missing' ? 'Missing' : 'N/A';
           return `<div class="chip">
             <span>${escapeHtml(intg.name || intg.id)}</span>
             <span class="badge ${badgeCls}">${escapeHtml(statusText)}</span>
           </div>`;
         }).join('')}
       </div>`
    : '';

  const findingsRowsHtml = findings.length
    ? findings.map((f, idx) => {
        const evidenceList: string[] = Array.isArray(f.evidence) ? f.evidence.slice(0, 3) : [];
        const fixSteps: string[] = Array.isArray(f.fixSteps) ? f.fixSteps.slice(0, 2) : [];
        return `
          <tr>
            <td style="width:28px;font-weight:700;color:#64748B;">${idx + 1}</td>
            <td style="width:120px;font-weight:700;color:#1E293B;">${escapeHtml(f.category || 'General')}</td>
            <td>
              <div style="font-weight:700;color:#0F172A;margin-bottom:2px;">${escapeHtml(f.title || 'Check')}</div>
              <div style="color:#334155;">${escapeHtml(f.description || '')}</div>
              ${evidenceList.length > 0
                ? `<ul class="evidence-list">${evidenceList.map(ev => `<li>${escapeHtml(ev)}</li>`).join('')}</ul>`
                : ''}
              ${fixSteps.length > 0 && (f.severity === 'critical' || f.severity === 'warning')
                ? `<div class="fix-note"><strong>Remediation:</strong> ${fixSteps.map(s => escapeHtml(s)).join(' ')}</div>`
                : ''}
            </td>
            <td style="width:76px;text-align:right;">${getSeverityBadge(f.severity)}</td>
          </tr>`;
      }).join('')
    : `<tr><td colspan="4" style="text-align:center;color:#64748B;padding:16px;">No detailed check findings recorded in this audit snapshot.</td></tr>`;

  return `
    <div class="report-hero">
      <div>
        <div class="hero-brand">22-Point GA4 Property Audit</div>
        <h1 class="hero-title">${escapeHtml(displayName)}</h1>
        <p class="hero-sub">${escapeHtml(subParts.join(' • ') || params.auditId)}</p>
      </div>
      <div class="score-box">
        ${buildScoreGaugeSvg(score)}
        <div>
          <div style="font-size:9px;color:#94A3B8;text-transform:uppercase;font-weight:700;">Health Score</div>
          <div style="font-size:15px;font-weight:800;color:#FFFFFF;">${escapeHtml(score)} / 100</div>
          <span class="grade-pill" style="background:${badge.bg};color:${badge.fg};">${escapeHtml(report.grade || badge.label)}</span>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">Property ID / Stream</div>
        <div class="meta-value">${escapeHtml(params.propertyId || meta.propertyId || 'N/A')} ${meta.measurementId ? `(${escapeHtml(meta.measurementId)})` : ''}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Project / Domain</div>
        <div class="meta-value">${escapeHtml(params.projectName || 'Workspace Audit')}${params.websiteUrl ? ` — ${escapeHtml(params.websiteUrl)}` : meta.defaultUri ? ` — ${escapeHtml(meta.defaultUri)}` : ''}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Config &amp; Timestamp</div>
        <div class="meta-value">${escapeHtml(meta.timeZone || 'UTC')} • ${escapeHtml(meta.dataRetention || 'Default')} • ${escapeHtml(params.createdAt || report.generatedAt || '')}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Critical Issues</div>
        <div class="kpi-val" style="color:#DC2626;">${escapeHtml(criticalCount)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Warnings &amp; Review</div>
        <div class="kpi-val" style="color:#D97706;">${escapeHtml(warningCount)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Checks Passed</div>
        <div class="kpi-val" style="color:#059669;">${escapeHtml(passedCount)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">30d Sessions / Revenue</div>
        <div class="kpi-val" style="font-size:13px;">${escapeHtml(formatNum(totals.sessions))} <span style="font-size:10px;color:#64748B;font-weight:600;">/ $${escapeHtml(formatNum(totals.totalRevenue, 2))}</span></div>
      </div>
    </div>

    ${integrationsHtml}

    <div class="section-title">Full Diagnostic Check Breakdown (${escapeHtml(findings.length)} Checks)</div>
    <table class="audit-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Category</th>
          <th>Check Details &amp; Remediation</th>
          <th style="text-align:right;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${findingsRowsHtml}
      </tbody>
    </table>
  `;
}

export interface GtmAuditPdfParams {
  auditId: string;
  gtmId: string;
  projectName?: string | null;
  websiteUrl?: string | null;
  gtmContainerName?: string | null;
  gtmWorkspaceName?: string | null;
  healthScore: number;
  issueCount?: number;
  createdAt?: string | null;
  rawData: any;
}

interface GtmIssueItem {
  title: string;
  description: string;
  action?: string;
}

function analyzeGtmIssuesFromRaw(rawData: any): {
  critical: GtmIssueItem[];
  moderate: GtmIssueItem[];
  tagCount: number;
  triggerCount: number;
  variableCount: number;
} {
  const tags: any[] = Array.isArray(rawData?.tags) ? rawData.tags : [];
  const triggers: any[] = Array.isArray(rawData?.triggers) ? rawData.triggers : [];
  const variables: any[] = Array.isArray(rawData?.variables) ? rawData.variables : [];

  const tagCount = rawData?.summary?.totalTags ?? rawData?.tagCount ?? tags.length;
  const triggerCount = rawData?.summary?.totalTriggers ?? rawData?.triggerCount ?? triggers.length;
  const variableCount = rawData?.summary?.totalVariables ?? rawData?.variableCount ?? variables.length;

  if (rawData?.issues && (Array.isArray(rawData.issues.critical) || Array.isArray(rawData.issues.moderate))) {
    return {
      critical: Array.isArray(rawData.issues.critical) ? rawData.issues.critical : [],
      moderate: Array.isArray(rawData.issues.moderate) ? rawData.issues.moderate : [],
      tagCount,
      triggerCount,
      variableCount
    };
  }

  const critical: GtmIssueItem[] = [];
  const moderate: GtmIssueItem[] = [];
  const triggerUsage: Record<string, any[]> = {};

  tags.forEach(t => {
    (t?.firingTriggerId || []).forEach((trigId: string) => {
      if (!triggerUsage[trigId]) triggerUsage[trigId] = [];
      triggerUsage[trigId].push(t);
    });
  });

  Object.keys(triggerUsage).forEach(trigId => {
    const tagsUsingTrig = triggerUsage[trigId];
    const trigInfo = triggers.find(tr => tr?.triggerId === trigId);
    const trigName = trigInfo ? trigInfo.name : trigId;

    if (tagsUsingTrig.length > 1) {
      const types: Record<string, boolean> = {};
      let hasDuplicateTypes = false;
      tagsUsingTrig.forEach(t => {
        if (types[t?.type]) hasDuplicateTypes = true;
        types[t?.type] = true;
      });

      if (hasDuplicateTypes) {
        critical.push({
          title: 'Duplicate Tags Detected',
          description: `Multiple tags of the same type share the trigger "${trigName}". Tags: ${tagsUsingTrig.map(t => t?.name || 'Unnamed').join(', ')}`,
          action: 'Review the listed tags in GTM and pause or remove redundant ones to prevent duplicate events.'
        });
      } else {
        moderate.push({
          title: 'Shared Trigger',
          description: `The trigger "${trigName}" is shared by ${tagsUsingTrig.length} tags: ${tagsUsingTrig.map(t => t?.name || 'Unnamed').join(', ')}.`,
          action: 'Verify all attached tags are intended to fire together or split into dedicated triggers.'
        });
      }
    }
  });

  triggers.forEach(tr => {
    if (tr?.triggerId && !triggerUsage[tr.triggerId]) {
      moderate.push({
        title: 'Orphaned Trigger',
        description: `The trigger "${tr.name || tr.triggerId}" is not attached to any tags.`,
        action: 'Delete unused triggers from the GTM workspace to keep container maintenance clean.'
      });
    }
  });

  const allDataStr = JSON.stringify(tags) + JSON.stringify(triggers);
  variables.forEach(v => {
    if (v?.name && !String(v.name).startsWith('_') && !allDataStr.includes(`{{${v.name}}}`)) {
      moderate.push({
        title: 'Orphaned Variable',
        description: `The variable "${v.name}" is not referenced by any tags or triggers.`,
        action: 'Remove unused user-defined variables to minimize GTM container script size.'
      });
    }
  });

  return { critical, moderate, tagCount, triggerCount, variableCount };
}

export function buildGtmAuditPdfHtml(params: GtmAuditPdfParams): string {
  const rawData = params.rawData || {};
  const analysis = analyzeGtmIssuesFromRaw(rawData);
  const score = Number.isFinite(params.healthScore) ? params.healthScore : 100;
  const badge = getScoreBadge(score);
  const totalIssues = params.issueCount ?? (analysis.critical.length + analysis.moderate.length);

  const subParts = [
    params.projectName ? `Project: ${params.projectName}` : '',
    params.gtmContainerName ? `Container: ${params.gtmContainerName}` : '',
    params.gtmWorkspaceName ? `Workspace: ${params.gtmWorkspaceName}` : '',
    params.websiteUrl || ''
  ].filter(Boolean);

  const criticalHtml = analysis.critical.length > 0
    ? analysis.critical.map(item => `
        <div class="issue-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;">
            <strong style="font-size:11px;color:#0F172A;">${escapeHtml(item.title)}</strong>
            <span class="badge badge-critical">Critical</span>
          </div>
          <div style="font-size:10px;color:#334155;">${escapeHtml(item.description)}</div>
          ${item.action ? `<div class="fix-note"><strong>Action:</strong> ${escapeHtml(item.action)}</div>` : ''}
        </div>
      `).join('')
    : '<div class="issue-card passed"><strong style="color:#047857;">No critical GTM conflicts found.</strong> All firing tags show clean configuration.</div>';

  const moderateHtml = analysis.moderate.length > 0
    ? analysis.moderate.map(item => `
        <div class="issue-card moderate">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;">
            <strong style="font-size:11px;color:#0F172A;">${escapeHtml(item.title)}</strong>
            <span class="badge badge-warning">Review</span>
          </div>
          <div style="font-size:10px;color:#334155;">${escapeHtml(item.description)}</div>
          ${item.action ? `<div class="fix-note"><strong>Recommendation:</strong> ${escapeHtml(item.action)}</div>` : ''}
        </div>
      `).join('')
    : '<div class="issue-card passed"><strong style="color:#047857;">Clean container hygiene.</strong> Zero orphaned triggers, unused variables, or unintended shared triggers detected.</div>';

  return `
    <div class="report-hero">
      <div>
        <div class="hero-brand">GTM Workspace Health Audit</div>
        <h1 class="hero-title">${escapeHtml(params.gtmId || 'GTM Container')}</h1>
        <p class="hero-sub">${escapeHtml(subParts.join(' • ') || params.auditId)}</p>
      </div>
      <div class="score-box">
        ${buildScoreGaugeSvg(score)}
        <div>
          <div style="font-size:9px;color:#94A3B8;text-transform:uppercase;font-weight:700;">Health Score</div>
          <div style="font-size:15px;font-weight:800;color:#FFFFFF;">${escapeHtml(score)} / 100</div>
          <span class="grade-pill" style="background:${badge.bg};color:${badge.fg};">${escapeHtml(badge.label)}</span>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">Container ID</div>
        <div class="meta-value">${escapeHtml(params.gtmId || 'N/A')}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Project / Website</div>
        <div class="meta-value">${escapeHtml(params.projectName || 'Workspace')}${params.websiteUrl ? ` — ${escapeHtml(params.websiteUrl)}` : ''}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Audit Timestamp</div>
        <div class="meta-value">${escapeHtml(params.createdAt || '')}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Active Tags</div>
        <div class="kpi-val">${escapeHtml(analysis.tagCount)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Triggers Scanned</div>
        <div class="kpi-val">${escapeHtml(analysis.triggerCount)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Variables Scanned</div>
        <div class="kpi-val">${escapeHtml(analysis.variableCount)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Issues Flagged</div>
        <div class="kpi-val" style="color:${totalIssues > 0 ? '#D97706' : '#059669'};">${escapeHtml(totalIssues)}</div>
      </div>
    </div>

    <div class="section-title">Critical Findings (${escapeHtml(analysis.critical.length)})</div>
    ${criticalHtml}

    <div class="section-title">Optimization &amp; Hygiene Review (${escapeHtml(analysis.moderate.length)})</div>
    ${moderateHtml}
  `;
}

export interface Ga4AlertReportPdfParams {
  propertyName: string;
  isTriggered: boolean;
  matchType: 'ALL' | 'ANY';
  comparisonLabel: string;
  comparedDatesLabel: string;
  scheduleLabel: string;
  conditions: EvaluatedCondition[];
}

export function buildGa4AlertReportPdfHtml(params: Ga4AlertReportPdfParams): string {
  const accentColor = params.isTriggered ? '#EF4444' : '#00F0FF';
  const statusLabel = params.isTriggered ? 'Anomaly Detected' : 'All Conditions Stable';
  const rowsHtml = params.conditions
    .map((c, idx) => {
      const segParts: string[] = [];
      if (c.source !== 'All' && c.medium !== 'All') segParts.push(`${c.source} / ${c.medium}`);
      else if (c.source !== 'All') segParts.push(c.source);
      else if (c.medium !== 'All') segParts.push(`Medium: ${c.medium}`);
      if (c.device !== 'All') segParts.push(c.device);
      const segmentText = segParts.length > 0 ? segParts.join(' • ') : 'All Traffic';

      const pctStr = `${c.percentChange > 0 ? '+' : ''}${c.percentChange.toFixed(1)}%`;
      const pctColor = c.percentChange < 0 ? '#DC2626' : '#0284C7';
      const badgeHtml = c.isTriggered
        ? '<span class="badge badge-critical">Triggered</span>'
        : '<span class="badge badge-passed">OK</span>';

      return `
        <tr>
          <td style="width:24px;font-weight:700;color:#64748B;">${idx + 1}</td>
          <td>
            <div style="font-weight:700;color:#0F172A;text-transform:capitalize;">${escapeHtml(c.metric)}</div>
            <div style="font-size:9px;color:#64748B;">${escapeHtml(segmentText)}</div>
          </td>
          <td>${escapeHtml(c.operatorLabel)}</td>
          <td>${escapeHtml(c.formattedPast)} &rarr; <strong>${escapeHtml(c.formattedCurrent)}</strong></td>
          <td style="font-weight:800;color:${pctColor};text-align:right;">${escapeHtml(pctStr)}</td>
          <td style="text-align:right;">${badgeHtml}</td>
        </tr>`;
    })
    .join('');

  return `
    <div class="report-hero" style="border-left-color:${accentColor};">
      <div>
        <div class="hero-brand">GA4 Observer Telemetry Report</div>
        <h1 class="hero-title">${escapeHtml(params.propertyName)}</h1>
        <p class="hero-sub">${escapeHtml(statusLabel)} • Match ${escapeHtml(params.matchType)}</p>
      </div>
      <div class="score-box">
        <div>
          <div style="font-size:9px;color:#94A3B8;text-transform:uppercase;font-weight:700;">Observer State</div>
          <div style="font-size:14px;font-weight:800;color:${params.isTriggered ? '#FCA5A5' : '#5EEAD4'};">${escapeHtml(statusLabel)}</div>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">Comparison Window</div>
        <div class="meta-value">${escapeHtml(params.comparisonLabel)}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Dates Compared</div>
        <div class="meta-value">${escapeHtml(params.comparedDatesLabel)}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Schedule</div>
        <div class="meta-value">${escapeHtml(params.scheduleLabel)}</div>
      </div>
    </div>

    <div class="section-title">Evaluated Rule Conditions (${escapeHtml(params.conditions.length)})</div>
    <table class="audit-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Metric &amp; Segment</th>
          <th>Rule Condition</th>
          <th>Baseline &rarr; Current</th>
          <th style="text-align:right;">Delta</th>
          <th style="text-align:right;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}
