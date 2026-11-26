import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { Zap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GA4Dashboard } from '../components/analytics/GA4Dashboard';
import { PageTransition } from '../components/ui/PageTransition';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { getSandboxState } from '../utils/localDemoStore';
import type { Project } from '../types/project';
import '../pages/Dashboard.css';

interface AnalyticsProps {
  project?: Project;
}

export const Analytics: React.FC<AnalyticsProps> = ({ project }) => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { isSandboxMode, userTier: ctxTier } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'custom'>('free');
  const [deploymentCount, setDeploymentCount] = useState(0);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);
  const [recentGa4Audits, setRecentGa4Audits] = useState<any[]>([]);

  useEffect(() => {
    if (isSandboxMode) {
      const s = getSandboxState();
      setUserTier(ctxTier || s.tier);
      setDeploymentCount(project ? 3 : 5);
      const filteredGtm = project
        ? s.gtmAudits.filter(
            (a) =>
              a.projectId === project.id ||
              (project.gtm_container_public_id && a.gtmId === project.gtm_container_public_id)
          )
        : s.gtmAudits;
      const filteredGa4 = project
        ? s.ga4Audits.filter(
            (a) =>
              a.projectId === project.id ||
              (project.ga4_property_id && a.propertyId === project.ga4_property_id)
          )
        : s.ga4Audits;
      setRecentAudits(filteredGtm);
      setRecentGa4Audits(filteredGa4);
      setLoading(false);
      return;
    }

    if (!isLoaded || !user) return;

    const fetchData = async () => {
      try {
        const email = user?.primaryEmailAddress?.emailAddress || '';
        const token = await getToken();
        if (!token) return;
        const authHeaders = { Authorization: `Bearer ${token}` };

        const meRes = await fetch(`/api/user/me?email=${encodeURIComponent(email)}`, {
          headers: authHeaders
        });
        const meData = await meRes.json();
        if (meData && meData.subscription_tier) {
          setUserTier(meData.subscription_tier);
          setDeploymentCount(meData.account_deployment_count || 0);
        }

        const gtmQuery = project
          ? `/api/gtm/audit-logs?projectId=${encodeURIComponent(project.id)}&gtmId=${encodeURIComponent(project.gtm_container_public_id || '')}`
          : '/api/gtm/audit-logs';
        const auditRes = await fetch(gtmQuery, { headers: authHeaders });
        const auditData = await auditRes.json();
        if (auditData.logs) {
          setRecentAudits(auditData.logs);
        }

        if (token) {
          const ga4Query = project
            ? `/api/ga4/audit?history=true&projectId=${encodeURIComponent(project.id)}&propertyId=${encodeURIComponent(project.ga4_property_id || '')}`
            : '/api/ga4/audit?history=true';
          const ga4Res = await fetch(ga4Query, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (ga4Res.ok) {
            const ga4Data = await ga4Res.json();
            setRecentGa4Audits(ga4Data.logs || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch analytics data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, isLoaded, project, isSandboxMode, ctxTier, getToken]);

  const limit = userTier === 'free' ? 5 : userTier === 'pro' ? 10 : 999;
  const progressPercent = Math.min((deploymentCount / limit) * 100, 100);

  const totalTags = recentAudits.reduce((acc, curr) => acc + (Number(curr.tagCount) || 0), 0);
  const totalTriggers = recentAudits.reduce((acc, curr) => acc + (Number(curr.triggerCount) || 0), 0);
  const totalVariables = recentAudits.reduce((acc, curr) => acc + (Number(curr.variableCount) || 0), 0);
  const maxMetric = Math.max(totalTags, totalTriggers, totalVariables, 1);

  const CircularChart = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / max) * circumference;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
            <motion.circle
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
              cx="50"
              cy="50"
              r={radius}
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{value}</span>
          </div>
        </div>
        <span style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '1rem', fontWeight: 500 }}>{label}</span>
      </div>
    );
  };

  const observerTarget = project ? `/projects/${project.id}/observer` : '/organization';

  return (
    <PageTransition locationKey={`analytics-${project?.id || 'global'}`}>
      <BackgroundMesh />
      <div className="dashboard-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
        >
          <div>
            <h1 className="dashboard-title">
              {project ? `${project.name} — Analytics & Usage` : 'Analytics & Usage'}
            </h1>
            <p className="dashboard-subtitle">
              {project
                ? 'Strictly scoped GA4 metrics, GTM workspace audits, and 22-point GA4 audit history for this project.'
                : 'Monitor your deployment limits and view historical workspace audits.'}
            </p>
          </div>
          <Link
            to={observerTarget}
            className="btn-deploy-bulk"
            style={{ marginTop: 0, textDecoration: 'none', padding: '0.7rem 1.3rem', fontSize: '0.88rem' }}
          >
            <ShieldCheck size={16} style={{ marginRight: '0.45rem' }} />
            Open GA4 Observer &amp; Audit &rarr;
          </Link>
        </motion.div>

        <GA4Dashboard
          lockedPropertyId={project ? project.ga4_property_id || '' : undefined}
          lockedPropertyName={project ? project.ga4_property_name || undefined : undefined}
          projectName={project?.name}
          projectId={project?.id}
        />

        <div className="settings-section" style={{ marginTop: '3rem' }}>
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">
              <Zap className="text-yellow-400" size={24} />
              Platform Usage
            </h3>
            <p className="dashboard-section-subtitle">Your organization subscription tier limits and container statistics.</p>
          </div>

          <div className="module-card" style={{ padding: '2rem', marginTop: '1.5rem', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>Automated Deployments</h4>
                <p style={{ margin: 0, color: '#9CA3AF', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                  Deployments used this billing cycle
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#00F0FF' }}>{deploymentCount}</span>
                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}> / {userTier === 'custom' ? 'Unlimited' : limit}</span>
              </div>
            </div>

            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #00F0FF 0%, #34D399 100%)', borderRadius: '6px' }}
              />
            </div>
          </div>

          <div className="module-card" style={{ padding: '2rem', marginTop: '1.5rem', cursor: 'default' }}>
            <h4 style={{ margin: 0, fontSize: '1.25rem', color: 'white', marginBottom: '1.5rem' }}>
              Aggregated Container Components {project ? `(${project.gtm_container_public_id || project.name})` : ''}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <CircularChart value={totalTags} max={maxMetric} label="Tags" color="#00F0FF" />
              <CircularChart value={totalTriggers} max={maxMetric} label="Triggers" color="#34D399" />
              <CircularChart value={totalVariables} max={maxMetric} label="Variables" color="#FBBF24" />
            </div>
          </div>
        </div>

        {/* Project GTM Audits */}
        <div className="settings-section" style={{ marginTop: '3rem' }}>
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">
              <ShieldCheck className="text-green-400" size={24} />
              Recent GTM Workspace Audits
            </h3>
            <p className="dashboard-section-subtitle">
              {project ? `Historical GTM workspace audits for ${project.name}.` : 'Historical records of GTM workspaces you have audited.'}
            </p>
          </div>

          <div className="module-card" style={{ marginTop: '1.5rem', cursor: 'default', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '1rem', color: '#9CA3AF' }}>Loading audit history...</div>
            ) : recentAudits.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>No GTM audits have been performed for this project yet.</div>
            ) : (
              <div className="responsive-table-wrap" tabIndex={0} role="region" aria-label="Recent GTM Workspace Audits">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Date</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>GTM ID</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Score</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Tags</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Triggers</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Variables</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAudits.map((audit) => (
                      <tr key={audit.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>
                          {new Date(audit.createdAt).toLocaleDateString()} {new Date(audit.createdAt).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '1rem', color: '#00F0FF', fontSize: '0.875rem', fontWeight: 500 }}>
                          {audit.gtmId}
                        </td>
                        <td style={{ padding: '1rem', color: '#34D399', fontSize: '0.875rem', fontWeight: 700 }}>
                          {audit.healthScore ?? '—'}%
                        </td>
                        <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>{audit.tagCount}</td>
                        <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>{audit.triggerCount}</td>
                        <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>{audit.variableCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Project GA4 Audits */}
        {recentGa4Audits.length > 0 && (
          <div className="settings-section" style={{ marginTop: '2.5rem' }}>
            <div className="dashboard-section-header">
              <h3 className="dashboard-section-title">
                <ShieldCheck color="#00F0FF" size={24} />
                Recent 22-Point GA4 Property Audits
              </h3>
              <p className="dashboard-section-subtitle">Historical GA4 property diagnostics for this project.</p>
            </div>

            <div className="module-card" style={{ marginTop: '1.25rem', cursor: 'default', overflow: 'hidden' }}>
              <div className="responsive-table-wrap" tabIndex={0} role="region" aria-label="Recent 22-Point GA4 Property Audits">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Date</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>GA4 Property</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Score</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Critical</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Warnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentGa4Audits.map((ga4) => (
                      <tr key={ga4.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>
                          {new Date(ga4.createdAt).toLocaleDateString()} {new Date(ga4.createdAt).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '1rem', color: '#00F0FF', fontSize: '0.875rem', fontWeight: 500 }}>
                          {ga4.propertyName || ga4.propertyId}
                        </td>
                        <td style={{ padding: '1rem', color: '#34D399', fontSize: '0.875rem', fontWeight: 700 }}>
                          {ga4.healthScore}%
                        </td>
                        <td style={{ padding: '1rem', color: '#F87171', fontSize: '0.875rem' }}>{ga4.criticalCount}</td>
                        <td style={{ padding: '1rem', color: '#FACC15', fontSize: '0.875rem' }}>{ga4.warningCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};
