import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Users,
  MousePointerClick,
  DollarSign,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileDown,
  Link2,
  Globe
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import './AuditModal.css';

interface Ga4AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditReport: any | null;
  loading: boolean;
  errorMsg?: string;
}

export const Ga4AuditModal = ({
  isOpen,
  onClose,
  auditReport,
  loading,
  errorMsg
}: Ga4AuditModalProps) => {
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const healthScore = auditReport?.healthScore ?? 0;
  const healthColor = healthScore >= 90 ? '#4ADE80' : healthScore >= 70 ? '#FACC15' : '#F87171';
  const healthText =
    healthScore >= 90
      ? 'Perfect Tracking Health'
      : healthScore >= 70
        ? 'Good, Some Optimization Needed'
        : 'Requires immediate attention';

  const findings: any[] = auditReport?.findings || [];
  const criticalIssues = findings.filter(f => f.severity === 'critical');
  const reviewIssues = findings.filter(f => f.severity === 'warning' || f.severity === 'info');
  const passedIssues = findings.filter(f => f.severity === 'passed');

  const meta = auditReport?.propertyMeta || {};
  const totals = meta?.totals30d || {};
  const integrations: any[] = auditReport?.integrations || [];
  const referrals: any[] = auditReport?.forensics?.referrals || [];
  const channels: any[] = auditReport?.forensics?.channels || [];
  const keyEventsStatus: any[] = auditReport?.forensics?.keyEventsStatus || [];

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !auditReport) return;
    const element = reportRef.current;

    const bottomActions = element.querySelector('.audit-modal-bottom-actions') as HTMLElement | null;
    if (bottomActions) bottomActions.style.display = 'none';

    const originalMinHeight = element.style.minHeight;
    const originalBorderBottom = element.style.borderBottom;
    const originalBoxSizing = element.style.boxSizing;

    const width = element.offsetWidth;
    const a4Ratio = 297 / 210;
    const pageHeightPx = width * a4Ratio;
    const originalHeight = element.offsetHeight;
    const totalPages = Math.max(1, Math.ceil(originalHeight / pageHeightPx));
    const requiredHeight = totalPages * pageHeightPx;

    element.style.minHeight = `${requiredHeight}px`;
    element.style.boxSizing = 'border-box';
    element.style.borderBottom = '6px solid #00f0ff';

    try {
      const safeName = (meta.displayName || 'GA4-Property').replace(/[^a-zA-Z0-9_-]/g, '_');
      const opt: any = {
        margin: 0,
        filename: `${safeName} GA4-Audit-Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          backgroundColor: '#121212',
          useCORS: true,
          width: width,
          height: requiredHeight
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Failed to generate PDF.');
    } finally {
      if (bottomActions) bottomActions.style.display = 'flex';
      element.style.minHeight = originalMinHeight;
      element.style.borderBottom = originalBorderBottom;
      element.style.boxSizing = originalBoxSizing;
    }
  };

  return (
    <div className="audit-modal-overlay" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ga4-audit-modal-title"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="audit-modal-content"
        style={{ maxWidth: '860px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="audit-modal-sticky-header">
          <button className="audit-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="audit-header-row">
          <h2 id="ga4-audit-modal-title" className="audit-modal-title">GA4 Property Audit</h2>
          {!loading && auditReport && (
            <button className="btn-download-pdf" onClick={handleDownloadPdf}>
              <FileDown size={16} /> Export PDF
            </button>
          )}
        </div>

        {loading ? (
          <div className="audit-loading">
            <div className="spinner"></div>
            Fetching & Analyzing GA4 Property Configuration &amp; 30-Day Data...
          </div>
        ) : errorMsg ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <AlertTriangle size={40} style={{ color: '#EF4444', margin: '0 auto 0.75rem' }} />
            <h3 style={{ color: '#F87171', margin: '0 0 0.5rem 0' }}>GA4 Audit Failed</h3>
            <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{errorMsg}</p>
            <button className="btn-close-bottom" onClick={onClose}>Close</button>
          </div>
        ) : auditReport ? (
          <div className="audit-report-wrapper" id="ga4-audit-report-content" ref={reportRef}>
            <div className="audit-pdf-header">
              <div className="audit-pdf-logo">
                <img src="/gtmobserver-logo.webp" alt="GTMObserver" style={{ height: '34px' }} />
              </div>
              <div className="audit-pdf-gtm-id">
                {meta.displayName || 'GA4 Property'} ({meta.measurementId || meta.propertyId})
              </div>
            </div>

            {auditReport.isDemo && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '0.65rem 1rem',
                borderRadius: '0.6rem',
                background: 'rgba(0, 240, 255, 0.08)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                color: '#67E8F9',
                fontSize: '0.82rem'
              }}>
                <strong>Demo Audit Snapshot:</strong> Simulated hospitality GA4 telemetry exercising all 22 automated audit checks locally.
              </div>
            )}

            <div className="health-score-container">
              <div className="health-circle-wrapper">
                <svg viewBox="0 0 36 36" className="health-circle">
                  <path
                    className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle"
                    strokeDasharray={`${healthScore}, 100`}
                    style={{ stroke: healthColor }}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="percentage" style={{ color: healthColor }}>{healthScore}%</div>
              </div>
              <div className="health-score-info">
                <h2>GA4 Property Health</h2>
                <p>{healthText}</p>
                <div className="ga4-meta-row">
                  <span className="ga4-meta-tag">Timezone: {meta.timeZone || 'N/A'}</span>
                  <span className="ga4-meta-tag">Currency: {meta.currencyCode || 'N/A'}</span>
                  <span className="ga4-meta-tag">Retention: {meta.dataRetention || 'N/A'}</span>
                  <span className="ga4-meta-tag">Attribution: {meta.attributionModel || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 3-Box Summary matching GTM Audit Tags / Triggers / Variables */}
            <div className="audit-summary-boxes">
              <div className="summary-box">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="summary-val">{(totals.sessions || 0).toLocaleString()}</span>
                <span className="summary-label">30d Sessions</span>
              </div>
              <div className="summary-box">
                <MousePointerClick className="w-5 h-5 text-yellow-400" />
                <span className="summary-val">{(totals.keyEvents || 0).toLocaleString()}</span>
                <span className="summary-label">30d Key Events</span>
              </div>
              <div className="summary-box">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span className="summary-val">
                  ${(totals.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="summary-label">30d Revenue</span>
              </div>
            </div>

            {/* Integrations & Connections Matrix */}
            {integrations.length > 0 && (
              <div className="issues-section">
                <h3 className="issues-title">
                  <Link2 className="w-5 h-5" style={{ color: '#00F0FF' }} />
                  Integrations &amp; Product Connections ({integrations.filter(i => i.status === 'linked').length}/{integrations.length} Linked)
                </h3>
                <div className="ga4-integrations-mini-grid">
                  {integrations.map(item => (
                    <div key={item.id} className={`ga4-int-item ${item.status}`}>
                      <div className="ga4-int-header">
                        <strong>{item.name}</strong>
                        <span className="ga4-int-status">
                          {item.status === 'linked' ? 'Linked' : item.status === 'missing' ? 'Missing' : 'N/A'}
                        </span>
                      </div>
                      <span className="ga4-int-summary">{item.summary}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Critical / Moderate / Passed Issues mirroring AuditModal */}
            <div className="audit-issues-container">
              {criticalIssues.length === 0 && reviewIssues.filter(r => r.severity === 'warning').length === 0 && (
                <div className="audit-success-banner">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                  <h3>Setup is Perfect!</h3>
                  <p>No cross-domain leaks, missing critical links, PII exposures, or Key Event errors were found in this GA4 property.</p>
                </div>
              )}

              {criticalIssues.length > 0 && (
                <div className="issues-section critical-issues">
                  <h3 className="issues-title">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Immediate Attention Needed ({criticalIssues.length})
                  </h3>
                  <ul className="issues-list">
                    {criticalIssues.map((iss, i) => (
                      <li key={iss.id || i} className="issue-item">
                        <strong>
                          {iss.title}
                          <span className="ga4-cat-pill">{iss.category}</span>
                        </strong>
                        <p>{iss.description}</p>
                        {iss.evidence && iss.evidence.length > 0 && (
                          <div className="ga4-evidence-chips">
                            {iss.evidence.map((ev: string, eIdx: number) => (
                              <span key={eIdx} className="ga4-evidence-chip">{ev}</span>
                            ))}
                          </div>
                        )}
                        {iss.fixSteps && iss.fixSteps.length > 0 && (
                          <p className="issue-action">
                            <span className="action-label">Recommended Action:</span>{' '}
                            {iss.fixSteps.join(' ')}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {reviewIssues.length > 0 && (
                <div className="issues-section moderate-issues">
                  <h3 className="issues-title">
                    <Info className="w-5 h-5 text-yellow-500" />
                    Needs Review ({reviewIssues.length})
                  </h3>
                  <ul className="issues-list">
                    {reviewIssues.map((iss, i) => (
                      <li key={iss.id || i} className="issue-item">
                        <strong>
                          {iss.title}
                          <span className="ga4-cat-pill">{iss.category}</span>
                        </strong>
                        <p>{iss.description}</p>
                        {iss.evidence && iss.evidence.length > 0 && (
                          <div className="ga4-evidence-chips">
                            {iss.evidence.map((ev: string, eIdx: number) => (
                              <span key={eIdx} className="ga4-evidence-chip">{ev}</span>
                            ))}
                          </div>
                        )}
                        {iss.fixSteps && iss.fixSteps.length > 0 && (
                          <p className="issue-action">
                            <span className="action-label">Recommended Action:</span>{' '}
                            {iss.fixSteps.join(' ')}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {passedIssues.length > 0 && (
                <div className="issues-section passed-issues">
                  <h3 className="issues-title">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Passed Checks ({passedIssues.length})
                  </h3>
                  <ul className="issues-list">
                    {passedIssues.map((iss, i) => (
                      <li key={iss.id || i} className="issue-item">
                        <strong>
                          {iss.title}
                          <span className="ga4-cat-pill">{iss.category}</span>
                        </strong>
                        <p>{iss.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Compact 30-Day Forensics Tables */}
            {(referrals.length > 0 || channels.length > 0 || keyEventsStatus.length > 0) && (
              <div className="ga4-forensics-compact">
                {referrals.length > 0 && (
                  <div>
                    <h3 className="issues-title">
                      <Globe className="w-5 h-5" style={{ color: '#00F0FF' }} />
                      Top Referral Sources &amp; Cross-Domain Diagnosis
                    </h3>
                    <div className="ga4-mini-table-wrap" tabIndex={0} role="region" aria-label="Top Referral Sources Table">
                      <table className="ga4-mini-table">
                        <thead>
                          <tr>
                            <th>Source</th>
                            <th>Sessions</th>
                            <th>Key Events</th>
                            <th>Revenue</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referrals.slice(0, 10).map((r, idx) => (
                            <tr key={idx}>
                              <td><strong>{r.source}</strong></td>
                              <td>{(r.sessions || 0).toLocaleString()}</td>
                              <td>{(r.keyEvents || 0).toLocaleString()}</td>
                              <td>${(r.revenue || 0).toFixed(2)}</td>
                              <td style={{ color: r.flag !== 'normal' ? '#F87171' : '#34D399', fontWeight: 600 }}>
                                {r.flag === 'self_referral'
                                  ? 'Self-Referral Leak'
                                  : r.flag === 'booking_engine'
                                    ? 'Booking Engine Leak'
                                    : r.flag === 'payment_gateway'
                                      ? 'Payment Gateway Leak'
                                      : 'Normal'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {channels.length > 0 && (
                  <div>
                    <h3 className="issues-title">Channel Group Attribution (30d)</h3>
                    <div className="ga4-mini-table-wrap" tabIndex={0} role="region" aria-label="Channel Group Attribution Table">
                      <table className="ga4-mini-table">
                        <thead>
                          <tr>
                            <th>Channel</th>
                            <th>Sessions</th>
                            <th>Share</th>
                            <th>Key Events</th>
                            <th>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {channels.slice(0, 8).map((c, idx) => (
                            <tr key={idx}>
                              <td style={{ color: c.flag === 'unassigned' ? '#F87171' : '#E5E7EB' }}>
                                <strong>{c.channel}</strong>
                              </td>
                              <td>{(c.sessions || 0).toLocaleString()}</td>
                              <td>{c.sharePct}%</td>
                              <td>{(c.keyEvents || 0).toLocaleString()}</td>
                              <td>${(c.revenue || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {keyEventsStatus.length > 0 && (
                  <div>
                    <h3 className="issues-title">Configured Key Events Health</h3>
                    <div className="ga4-mini-table-wrap" tabIndex={0} role="region" aria-label="Configured Key Events Table">
                      <table className="ga4-mini-table">
                        <thead>
                          <tr>
                            <th>Key Event</th>
                            <th>Counting</th>
                            <th>30d Fires</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keyEventsStatus.map((ke, idx) => (
                            <tr key={idx}>
                              <td><strong>{ke.eventName}</strong></td>
                              <td>{ke.countingMethod}</td>
                              <td>{(ke.count30d || 0).toLocaleString()}</td>
                              <td style={{
                                color: ke.status === 'noisy' ? '#F87171' : ke.status === 'inactive' ? '#FACC15' : '#34D399',
                                fontWeight: 600
                              }}>
                                {ke.status === 'noisy' ? 'Noisy Non-Conversion' : ke.status === 'inactive' ? 'Inactive (0 in 30d)' : 'Firing Normally'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="audit-pdf-footer-greeting">
              <div className="audit-pdf-logo large">
                <img src="/gtmobserver-logo.webp" alt="GTMObserver" style={{ height: '44px' }} />
              </div>
              <p>Thank you for using GTMObserver to keep your tracking flawless!</p>
            </div>

            <div className="audit-modal-bottom-actions">
              <button className="btn-close-bottom" onClick={onClose}>
                Close Report
              </button>
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};
