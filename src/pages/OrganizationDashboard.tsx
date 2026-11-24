import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import {
  FolderKanban,
  PlusCircle,
  ArrowRight,
  Search,
  Activity,
  Code2,
  BarChart3,
  Sliders,
  CheckCircle2,
  Globe,
  Layers,
  FlaskConical,
  RotateCcw,
  Sparkles,
  CreditCard,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { PageTransition } from '../components/ui/PageTransition';
import { useWorkspace } from '../context/WorkspaceContext';
import { WEBSITE_TYPES, getWebsiteTypeMeta } from '../types/project';
import type { Project, WebsitePerspective } from '../types/project';
import {
  resetSandboxToNewUser,
  seedSandboxSampleProjects,
  updateSandboxProject,
  deleteSandboxProject
} from '../utils/localDemoStore';
import './Dashboard.css';
import './OrganizationDashboard.css';

export const OrganizationDashboard: React.FC = () => {
  const { projects, userTier, isSandboxMode, refreshWorkspace } = useWorkspace();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Quick Edit Project Modal state
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editType, setEditType] = useState<WebsitePerspective>('general');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Project Modal state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleOpenEdit = (project: Project) => {
    setProjectToEdit(project);
    setEditName(project.name || '');
    setEditUrl(project.website_url || '');
    setEditType((project.website_type as WebsitePerspective) || 'general');
    setEditError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectToEdit) return;
    if (!editName.trim()) {
      setEditError('Project name cannot be empty.');
      return;
    }
    setSavingEdit(true);
    setEditError('');
    try {
      if (isSandboxMode) {
        updateSandboxProject(projectToEdit.id, {
          name: editName.trim(),
          website_url: editUrl.trim(),
          website_type: editType
        });
        await refreshWorkspace();
        setProjectToEdit(null);
        return;
      }
      const token = await getToken();
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: projectToEdit.id,
          name: editName.trim(),
          websiteUrl: editUrl.trim(),
          websiteType: editType
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update project');
      }
      await refreshWorkspace();
      setProjectToEdit(null);
    } catch (err: any) {
      setEditError(err.message || 'Error updating project');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      if (isSandboxMode) {
        deleteSandboxProject(projectToDelete.id);
        await refreshWorkspace();
        setProjectToDelete(null);
        return;
      }
      const token = await getToken();
      const res = await fetch(`/api/projects?id=${encodeURIComponent(projectToDelete.id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete project');
      }
      await refreshWorkspace();
      setProjectToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting project');
    } finally {
      setDeleting(false);
    }
  };

  const params = new URLSearchParams(location.search);
  const createdProjectId = params.get('created');
  const createdProject = createdProjectId
    ? projects.find((p) => p.id === createdProjectId)
    : undefined;

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesType = filterType === 'all' || (p.website_type || 'general') === filterType;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesType;
      return (
        matchesType &&
        ((p.name || '').toLowerCase().includes(q) ||
          (p.website_url || '').toLowerCase().includes(q) ||
          (p.gtm_container_public_id || '').toLowerCase().includes(q) ||
          (p.ga4_property_name || '').toLowerCase().includes(q))
      );
    });
  }, [projects, filterType, searchQuery]);

  const totalGa4Linked = projects.filter((p) => Boolean(p.ga4_property_id)).length;
  const totalGtmLinked = projects.filter((p) => Boolean(p.gtm_container_id || p.gtm_container_public_id)).length;
  const totalMonitors = projects.reduce((sum, p) => sum + (p.monitorCount || 0), 0);

  const getScoreColor = (score: number | null | undefined) => {
    if (typeof score !== 'number') {
      return {
        bg: 'rgba(255, 255, 255, 0.05)',
        color: '#9CA3AF',
        border: 'rgba(255, 255, 255, 0.1)'
      };
    }
    if (score >= 90) {
      return {
        bg: 'rgba(16, 185, 129, 0.12)',
        color: '#6EE7B7',
        border: 'rgba(16, 185, 129, 0.25)'
      };
    }
    if (score >= 70) {
      return {
        bg: 'rgba(245, 158, 11, 0.12)',
        color: '#FCD34D',
        border: 'rgba(245, 158, 11, 0.25)'
      };
    }
    return {
      bg: 'rgba(239, 68, 68, 0.12)',
      color: '#FCA5A5',
      border: 'rgba(239, 68, 68, 0.25)'
    };
  };

  return (
    <PageTransition locationKey="organization">
      <BackgroundMesh />
      <div className="dashboard-container">
        {/* Local Sandbox Testing Controls */}
        {isSandboxMode && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              padding: '0.75rem 1.1rem',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.09)',
              border: '1px solid rgba(168, 85, 247, 0.28)',
              marginBottom: '1.5rem',
              fontSize: '0.82rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: '#E9D5FF' }}>
              <FlaskConical size={16} color="#C084FC" />
              <span>
                <strong>Local Test Sandbox:</strong> Test the entire Billing → Onboarding → Organization → Project flow locally.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={async () => {
                  resetSandboxToNewUser();
                  await refreshWorkspace();
                  navigate('/billing?reason=subscription_required');
                }}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  background: 'rgba(245, 158, 11, 0.14)',
                  color: '#FCD34D',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <CreditCard size={13} /> Simulate Fresh Free User (Test Billing)
              </button>
              <button
                type="button"
                onClick={async () => {
                  seedSandboxSampleProjects();
                  await refreshWorkspace();
                }}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#D1D5DB',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <RotateCcw size={13} /> Reset Sample Projects
              </button>
            </div>
          </div>
        )}

        {/* Newly Created Banner */}
        {createdProject && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#A7F3D0',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CheckCircle2 size={20} color="#10B981" />
              <span>
                <strong>{createdProject.name}</strong> has been created and added to your Organization Dashboard.
              </span>
            </div>
            <Link
              to={`/projects/${createdProject.id}/dashboard`}
              className="btn-deploy-bulk"
              style={{ marginTop: 0, textDecoration: 'none', padding: '0.55rem 1rem', fontSize: '0.85rem' }}
            >
              Enter Project Workspace <ArrowRight size={15} style={{ marginLeft: '0.35rem' }} />
            </Link>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.07em',
                color: '#00F0FF',
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
                marginBottom: '0.6rem'
              }}
            >
              <Layers size={13} />
              ORGANIZATION LEVEL • {userTier.toUpperCase()} PLAN
            </div>
            <h1 className="dashboard-title">Organization Dashboard</h1>
            <p className="dashboard-subtitle">
              Overview of every project in your organization. Select a project to open its dedicated, isolated workspace.
            </p>
          </div>

          <Link
            to="/onboarding"
            className="btn-deploy-bulk"
            style={{ marginTop: 0, textDecoration: 'none', padding: '0.78rem 1.35rem' }}
          >
            <PlusCircle size={17} style={{ marginRight: '0.45rem' }} />
            New Project Setup
          </Link>
        </motion.div>

        {/* Org KPI Strip */}
        <div className="org-kpi-grid">
          {[
            {
              label: 'Total Projects',
              value: projects.length,
              badge: projects.length === 1 ? '1 Active' : `${projects.length} Active`,
              footer: 'Isolated client & brand silos',
              icon: <FolderKanban size={19} color="#00F0FF" />,
              accent: '#00F0FF'
            },
            {
              label: 'GA4 Properties',
              value: totalGa4Linked,
              badge: totalGa4Linked > 0 ? 'Telemetry Linked' : 'Not Connected',
              footer: '30-day analytics & traffic monitoring',
              icon: <BarChart3 size={19} color="#10B981" />,
              accent: '#10B981'
            },
            {
              label: 'GTM Containers',
              value: totalGtmLinked,
              badge: totalGtmLinked > 0 ? 'Live Sync' : 'Not Linked',
              footer: 'Automated audit & recipe engine',
              icon: <Code2 size={19} color="#A855F7" />,
              accent: '#A855F7'
            },
            {
              label: 'Active Monitors',
              value: totalMonitors,
              badge: totalMonitors > 0 ? 'Running 24/7' : 'Ready to Setup',
              footer: 'Scheduled cron anomaly detection',
              icon: <Activity size={19} color="#F59E0B" />,
              accent: '#F59E0B'
            }
          ].map((stat) => (
            <div
              key={stat.label}
              className="org-kpi-card"
              style={
                {
                  '--accent-color': stat.accent,
                  '--accent-bg': `${stat.accent}15`,
                  '--accent-border': `${stat.accent}33`,
                  '--accent-glow': `${stat.accent}20`,
                  '--accent-shadow': `${stat.accent}25`
                } as React.CSSProperties
              }
            >
              <div className="org-kpi-top">
                <span className="org-kpi-label">
                  <span className="org-kpi-dot" />
                  {stat.label}
                </span>
                <div className="org-kpi-icon-wrapper">
                  {stat.icon}
                </div>
              </div>

              <div className="org-kpi-main">
                <div className="org-kpi-value">{stat.value}</div>
                <span className="org-kpi-badge">{stat.badge}</span>
              </div>

              <div className="org-kpi-footer">
                <span>{stat.footer}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.85rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ position: 'relative', minWidth: '250px', flex: '1 1 260px', maxWidth: '380px' }}>
            <Search size={16} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="search"
              placeholder="Search projects by name, domain, GTM ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="module-input"
              style={{ width: '100%', paddingLeft: '2.35rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: filterType === 'all' ? '1px solid #00F0FF' : '1px solid rgba(255,255,255,0.1)',
                background: filterType === 'all' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                color: filterType === 'all' ? '#00F0FF' : '#9CA3AF'
              }}
            >
              All ({projects.length})
            </button>
            {WEBSITE_TYPES.filter((wt) => wt.value !== 'general').map((wt) => (
              <button
                key={wt.value}
                type="button"
                onClick={() => setFilterType(wt.value)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: filterType === wt.value ? `1px solid ${wt.color}` : '1px solid rgba(255,255,255,0.1)',
                  background: filterType === wt.value ? `${wt.color}18` : 'rgba(255,255,255,0.03)',
                  color: filterType === wt.value ? wt.color : '#9CA3AF'
                }}
              >
                {wt.badge}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid / Empty State */}
        {projects.length === 0 ? (
          <div className="oauth-card" style={{ maxWidth: '580px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem' }}>
            <Sparkles size={40} color="#00F0FF" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Create Your First Project</h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
              Your organization is active! Launch guided onboarding to connect Google Analytics 4, link Google Tag Manager, and set initial anomaly triggers.
            </p>
            <Link to="/onboarding" className="btn-deploy-bulk" style={{ textDecoration: 'none', marginTop: 0 }}>
              Launch Project Onboarding →
            </Link>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="module-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#9CA3AF', cursor: 'default' }}>
            No projects match your current search or filter.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))',
              gap: '1.25rem'
            }}
          >
            {filteredProjects.map((project, idx) => {
              const typeMeta = getWebsiteTypeMeta(project.website_type);
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="org-project-card"
                >
                  <div>
                    <div className="org-project-header">
                      <div>
                        <span
                          className="org-project-badge"
                          style={{
                            color: typeMeta.color,
                            background: `${typeMeta.color}18`,
                            border: `1px solid ${typeMeta.color}40`
                          }}
                        >
                          {typeMeta.badge}
                        </span>
                        <h3 className="org-project-title">
                          {project.name}
                        </h3>
                        {project.website_url && (
                          <div className="org-project-url">
                            <Globe size={13} />
                            <span>{project.website_url.replace(/^https?:\/\//, '')}</span>
                          </div>
                        )}
                      </div>

                      <div className="org-project-actions">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(project)}
                          title="Quick Edit Project"
                          aria-label="Edit Project"
                          className="org-action-btn edit-btn"
                        >
                          <Pencil size={14} />
                        </button>
                        <Link
                          to={`/projects/${project.id}/settings`}
                          title="Full Project Settings & Integrations"
                          aria-label="Project Settings"
                          className="org-action-btn settings-btn"
                        >
                          <Sliders size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(project)}
                          title="Delete Project"
                          aria-label="Delete Project"
                          className="org-action-btn delete-btn"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Connected Bindings */}
                    <div className="org-project-integrations">
                      <div className="org-integration-row">
                        <span className="org-integration-label">GA4 Property:</span>
                        <span
                          className="org-integration-value"
                          style={{ color: project.ga4_property_id ? '#E5E7EB' : '#6B7280' }}
                          title={project.ga4_property_name || project.ga4_property_id || 'Not Connected'}
                        >
                          {project.ga4_property_name || project.ga4_property_id || 'Not Connected'}
                        </span>
                      </div>
                      <div className="org-integration-row">
                        <span className="org-integration-label">GTM Container:</span>
                        <span
                          className="org-integration-value"
                          style={{
                            color: project.gtm_container_public_id ? '#00F0FF' : '#6B7280',
                            fontFamily: 'monospace'
                          }}
                        >
                          {project.gtm_container_public_id || 'Not Linked'}
                        </span>
                      </div>
                    </div>

                    {/* Health & Activity Pills */}
                    <div className="org-project-scores">
                      <span
                        className="org-score-pill"
                        style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          color: '#7DD3FC',
                          border: '1px solid rgba(56, 189, 248, 0.25)'
                        }}
                      >
                        {project.monitorCount || 0} GA4 Monitors
                      </span>
                      {(() => {
                        const gtmCol = getScoreColor(project.latestGtmScore);
                        const ga4Col = getScoreColor(project.latestGa4Score);
                        return (
                          <>
                            <span
                              className="org-score-pill"
                              style={{
                                background: gtmCol.bg,
                                color: gtmCol.color,
                                border: `1px solid ${gtmCol.border}`
                              }}
                            >
                              GTM Health: {typeof project.latestGtmScore === 'number' ? `${project.latestGtmScore}%` : '—'}
                            </span>
                            <span
                              className="org-score-pill"
                              style={{
                                background: ga4Col.bg,
                                color: ga4Col.color,
                                border: `1px solid ${ga4Col.border}`
                              }}
                            >
                              GA4 Audit: {typeof project.latestGa4Score === 'number' ? `${project.latestGa4Score}%` : '—'}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                    className="org-project-btn"
                  >
                    Open Project Workspace <ArrowRight size={16} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Edit Project Modal */}
      <AnimatePresence>
        {projectToEdit && (
          <div className="org-modal-overlay" onClick={() => !savingEdit && setProjectToEdit(null)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="org-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="org-modal-header">
                <h3 className="org-modal-title">Edit Project</h3>
                <button
                  type="button"
                  className="org-modal-close-btn"
                  onClick={() => !savingEdit && setProjectToEdit(null)}
                  aria-label="Close"
                  disabled={savingEdit}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="org-modal-body">
                {editError && (
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: '#FCA5A5',
                      fontSize: '0.82rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <AlertTriangle size={15} color="#EF4444" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="org-modal-field">
                  <label className="org-modal-label">Project Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="module-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. My Website Tracker"
                  />
                </div>

                <div className="org-modal-field">
                  <label className="org-modal-label">Website URL</label>
                  <input
                    type="text"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="module-input"
                    style={{ width: '100%' }}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="org-modal-field">
                  <label className="org-modal-label">Website Perspective / Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as WebsitePerspective)}
                    className="module-input"
                    style={{ width: '100%' }}
                  >
                    {WEBSITE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label} ({t.badge})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#9CA3AF' }}>
                  Need to change GTM accounts, containers, or GA4 properties?{' '}
                  <Link
                    to={`/projects/${projectToEdit.id}/settings`}
                    style={{ color: '#00F0FF', textDecoration: 'underline' }}
                    onClick={() => setProjectToEdit(null)}
                  >
                    Open Full Project Settings &rarr;
                  </Link>
                </div>

                <div className="org-modal-actions">
                  <button
                    type="button"
                    className="org-btn-secondary"
                    onClick={() => setProjectToEdit(null)}
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="org-btn-primary"
                    disabled={savingEdit}
                  >
                    {savingEdit ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Project Confirmation Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="org-modal-overlay" onClick={() => !deleting && setProjectToDelete(null)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="org-modal-card"
              style={{ maxWidth: '460px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="org-modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.2)' }}>
                <h3 className="org-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444' }}>
                  <AlertTriangle size={20} /> Delete Project
                </h3>
                <button
                  type="button"
                  className="org-modal-close-btn"
                  onClick={() => !deleting && setProjectToDelete(null)}
                  aria-label="Close"
                  disabled={deleting}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="org-modal-body">
                {deleteError && (
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: '#FCA5A5',
                      fontSize: '0.82rem',
                      marginBottom: '1rem'
                    }}
                  >
                    {deleteError}
                  </div>
                )}

                <p style={{ margin: '0 0 0.85rem', color: '#FFFFFF', fontSize: '1rem', fontWeight: 600 }}>
                  Are you sure you want to delete <span style={{ color: '#00F0FF' }}>&ldquo;{projectToDelete.name}&rdquo;</span>?
                </p>

                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  This will permanently delete this project workspace, associated automated GA4 monitors, and historical audit records from your organization. This action cannot be undone.
                </p>

                <div className="org-modal-actions">
                  <button
                    type="button"
                    className="org-btn-secondary"
                    onClick={() => setProjectToDelete(null)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="org-btn-danger"
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} /> Delete Project
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};
