import { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Tag, Zap, AlertTriangle, Info, CheckCircle2, FileDown, Box } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import './AuditModal.css';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditData: { tags: any[]; triggers: any[]; variables: any[] } | null;
  loading: boolean;
  gtmId?: string;
  userId?: string;
  onAuditSaved?: () => void;
}

export const AuditModal = ({ isOpen, onClose, auditData, loading, gtmId = 'GTM-XXXXX', userId, onAuditSaved }: AuditModalProps) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const issues = useMemo(() => {
    const res = { critical: [] as any[], moderate: [] as any[] };
    if (!auditData) return res;

    const { tags, triggers, variables } = auditData;
    const triggerUsage: Record<string, any[]> = {};
    
    tags.forEach(t => {
      (t.firingTriggerId || []).forEach((trigId: string) => {
        if (!triggerUsage[trigId]) triggerUsage[trigId] = [];
        triggerUsage[trigId].push(t);
      });
    });

    Object.keys(triggerUsage).forEach(trigId => {
      const tagsUsingTrig = triggerUsage[trigId];
      const trigInfo = triggers.find(tr => tr.triggerId === trigId);
      const trigName = trigInfo ? trigInfo.name : trigId;

      if (tagsUsingTrig.length > 1) {
        const types: Record<string, boolean> = {};
        let hasDuplicateTypes = false;
        tagsUsingTrig.forEach(t => {
          if (types[t.type]) hasDuplicateTypes = true;
          types[t.type] = true;
        });

        if (hasDuplicateTypes) {
          res.critical.push({
            title: 'Duplicate Tags Detected',
            description: `Multiple tags of the same type share the trigger "${trigName}". Tags: ${tagsUsingTrig.map(t => t.name).join(', ')}`,
            action: 'Review the listed tags in GTM. Pause or delete the redundant ones to prevent duplicate data from being sent to your analytics platforms.'
          });
        } else {
          res.moderate.push({
            title: 'Shared Trigger',
            description: `The trigger "${trigName}" is shared by ${tagsUsingTrig.length} different tags: ${tagsUsingTrig.map(t => t.name).join(', ')}. Please review to ensure this is intentional.`,
            action: 'Verify if all these tags are supposed to fire at the exact same time. If not, create separate specific triggers for them.'
          });
        }
      }
    });

    triggers.forEach(tr => {
      if (!triggerUsage[tr.triggerId]) {
        res.moderate.push({
          title: 'Orphaned Trigger',
          description: `The trigger "${tr.name}" is not attached to any tags.`,
          action: 'Delete this trigger from your GTM workspace if it is no longer needed to keep your container clean.'
        });
      }
    });

    const allDataStr = JSON.stringify(tags) + JSON.stringify(triggers);
    variables.forEach(v => {
      if (!v.name.startsWith('_') && !allDataStr.includes(`{{${v.name}}}`)) {
        res.moderate.push({
          title: 'Orphaned Variable',
          description: `The variable "${v.name}" is not referenced by any tags or triggers.`,
          action: 'Delete this variable from your GTM workspace to reduce container size and improve loading performance.'
        });
      }
    });

    return res;
  }, [auditData]);

  const healthScore = useMemo(() => {
    let score = 100;
    score -= issues.critical.length * 20;
    score -= issues.moderate.length * 5;
    return Math.max(0, score);
  }, [issues]);

  const hasSavedRef = useRef(false);

  useEffect(() => {
    if (isOpen && auditData && userId && !hasSavedRef.current) {
      // Avoid saving the same audit repeatedly when it re-renders
      hasSavedRef.current = true;
      const saveLog = async () => {
        try {
          await fetch('/api/gtm/audit-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              gtmId,
              healthScore,
              issueCount: issues.critical.length + issues.moderate.length,
              rawData: auditData
            })
          });
          if (onAuditSaved) onAuditSaved();
        } catch (err) {
          console.error('Failed to save audit log', err);
        }
      };
      saveLog();
    }
    
    if (!isOpen) {
      hasSavedRef.current = false;
    }
  }, [isOpen, auditData, healthScore, issues, userId, gtmId, onAuditSaved]);

  const healthColor = healthScore === 100 ? '#4ADE80' : healthScore >= 70 ? '#FACC15' : '#F87171';
  const healthText = healthScore === 100 ? 'Perfect Tracking Health' : healthScore >= 70 ? 'Good, Some Optimization Needed' : 'Requires immediate attention';

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    
    // Hide the bottom actions button from the PDF
    const bottomActions = element.querySelector('.audit-modal-bottom-actions') as HTMLElement;
    if (bottomActions) bottomActions.style.display = 'none';

    // Calculate the required height to perfectly fill the final A4 page
    const originalMinHeight = element.style.minHeight;
    const originalBorderBottom = element.style.borderBottom;
    const originalBoxSizing = element.style.boxSizing;

    const width = element.offsetWidth;
    const a4Ratio = 297 / 210; // Standard A4 portrait ratio
    const pageHeightPx = width * a4Ratio;
    
    // Get the current height after hiding the button
    const originalHeight = element.offsetHeight;
    const totalPages = Math.ceil(originalHeight / pageHeightPx);
    
    // Set exactly calculated height
    const requiredHeight = totalPages * pageHeightPx;
    element.style.minHeight = `${requiredHeight}px`;
    element.style.boxSizing = 'border-box';
    element.style.borderBottom = '6px solid #00f0ff';

    try {
      const opt: any = {
        margin:       0,
        filename:     `${gtmId} Audit-Report.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          backgroundColor: '#121212', 
          useCORS: true,
          width: width,
          height: requiredHeight
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Failed to generate PDF.');
    } finally {
      // Restore styles
      if (bottomActions) bottomActions.style.display = 'flex';
      element.style.minHeight = originalMinHeight;
      element.style.borderBottom = originalBorderBottom;
      element.style.boxSizing = originalBoxSizing;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="audit-modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="audit-modal-content"
      >
        <div className="audit-modal-sticky-header">
          <button className="audit-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="audit-header-row">
          <h2 className="audit-modal-title">GTM Workspace Audit</h2>
          {!loading && auditData && (
            <button className="btn-download-pdf" onClick={handleDownloadPdf}>
              <FileDown size={16} /> Export PDF
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="audit-loading">
            <div className="spinner"></div>
            Fetching & Analyzing Workspace Data...
          </div>
        ) : auditData ? (
          <div className="audit-report-wrapper" id="audit-report-content" ref={reportRef}>
            
            <div className="audit-pdf-header">
              <div className="audit-pdf-logo"><img src="/gtmauto-logo.webp" alt="GTMAuto" style={{ height: '32px' }} /></div>
              <div className="audit-pdf-gtm-id">Container: {gtmId}</div>
            </div>

            <div className="health-score-container">
              <div className="health-circle-wrapper">
                <svg viewBox="0 0 36 36" className="health-circle">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle"
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
                <h2>Workspace Health</h2>
                <p>{healthText}</p>
              </div>
            </div>

            <div className="audit-summary-boxes">
              <div className="summary-box">
                <Tag className="w-5 h-5 text-blue-400" />
                <span className="summary-val">{auditData.tags.length}</span>
                <span className="summary-label">Tags</span>
              </div>
              <div className="summary-box">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="summary-val">{auditData.triggers.length}</span>
                <span className="summary-label">Triggers</span>
              </div>
              <div className="summary-box">
                <Box className="w-5 h-5 text-green-400" />
                <span className="summary-val">{auditData.variables?.length || 0}</span>
                <span className="summary-label">Variables</span>
              </div>
            </div>

            <div className="audit-issues-container">
              {issues.critical.length === 0 && issues.moderate.length === 0 && (
                <div className="audit-success-banner">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                  <h3>Setup is Perfect!</h3>
                  <p>No duplicate tags, shared triggers, or orphaned elements were found in this workspace.</p>
                </div>
              )}

              {issues.critical.length > 0 && (
                <div className="issues-section critical-issues">
                  <h3 className="issues-title">
                    <AlertTriangle className="w-5 h-5 text-red-500" /> 
                    Immediate Attention Needed ({issues.critical.length})
                  </h3>
                  <ul className="issues-list">
                    {issues.critical.map((iss, i) => (
                      <li key={i} className="issue-item">
                        <strong>{iss.title}</strong>
                        <p>{iss.description}</p>
                        {iss.action && <p className="issue-action"><span className="action-label">Recommended Action:</span> {iss.action}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {issues.moderate.length > 0 && (
                <div className="issues-section moderate-issues">
                  <h3 className="issues-title">
                    <Info className="w-5 h-5 text-yellow-500" /> 
                    Needs Review ({issues.moderate.length})
                  </h3>
                  <ul className="issues-list">
                    {issues.moderate.map((iss, i) => (
                      <li key={i} className="issue-item">
                        <strong>{iss.title}</strong>
                        <p>{iss.description}</p>
                        {iss.action && <p className="issue-action"><span className="action-label">Recommended Action:</span> {iss.action}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="audit-pdf-footer-greeting">
              <div className="audit-pdf-logo large"><img src="/gtmauto-logo.webp" alt="GTMAuto" style={{ height: '44px' }} /></div>
              <p>Thank you for using GTMAuto to keep your tracking flawless!</p>
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
