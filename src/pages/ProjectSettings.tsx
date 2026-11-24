import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  Save,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Globe,
  ExternalLink
} from 'lucide-react';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { PageTransition } from '../components/ui/PageTransition';
import { useWorkspace } from '../context/WorkspaceContext';
import { WEBSITE_TYPES } from '../types/project';
import type { Project, WebsitePerspective } from '../types/project';
import {
  SANDBOX_GA4_PROPERTIES,
  SANDBOX_GTM_ACCOUNTS,
  SANDBOX_GTM_CONTAINERS,
  SANDBOX_GTM_WORKSPACES,
  updateSandboxProject,
  deleteSandboxProject
} from '../utils/localDemoStore';
import './Dashboard.css';

interface ProjectSettingsProps {
  project: Project;
}

export const ProjectSettings: React.FC<ProjectSettingsProps> = ({ project }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const { isSandboxMode, googleConnected, refreshWorkspace } = useWorkspace();

  const [name, setName] = useState(project.name || '');
  const [websiteUrl, setWebsiteUrl] = useState(project.website_url || '');
  const [websiteType, setWebsiteType] = useState<WebsitePerspective>(
    (project.website_type as WebsitePerspective) || 'general'
  );
  const [ga4PropertyId, setGa4PropertyId] = useState(project.ga4_property_id || '');
  const [gtmAccountId, setGtmAccountId] = useState(project.gtm_account_id || '');
  const [gtmContainerId, setGtmContainerId] = useState(project.gtm_container_id || '');
  const [gtmWorkspaceId, setGtmWorkspaceId] = useState(project.gtm_workspace_id || '');
  const [measurementId, setMeasurementId] = useState(project.measurement_id || '');

  const [ga4Properties, setGa4Properties] = useState<any[]>([]);
  const [gtmAccounts, setGtmAccounts] = useState<any[]>([]);
  const [gtmContainers, setGtmContainers] = useState<any[]>([]);
  const [gtmWorkspaces, setGtmWorkspaces] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setName(project.name || '');
    setWebsiteUrl(project.website_url || '');
    setWebsiteType((project.website_type as WebsitePerspective) || 'general');
    setGa4PropertyId(project.ga4_property_id || '');
    setGtmAccountId(project.gtm_account_id || '');
    setGtmContainerId(project.gtm_container_id || '');
    setGtmWorkspaceId(project.gtm_workspace_id || '');
    setMeasurementId(project.measurement_id || '');
  }, [project]);

  useEffect(() => {
    if (!googleConnected && !isSandboxMode) return;
    if (isSandboxMode) {
      setGa4Properties(SANDBOX_GA4_PROPERTIES);
      setGtmAccounts(SANDBOX_GTM_ACCOUNTS);
      return;
    }
    const fetchLists = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const [ga4Res, gtmRes] = await Promise.all([
          fetch('/api/ga4/properties', { headers }),
          fetch('/api/gtm/accounts', { headers })
        ]);
        const ga4Data = await ga4Res.json().catch(() => ({}));
        const gtmData = await gtmRes.json().catch(() => ({}));
        if (ga4Res.ok && Array.isArray(ga4Data.properties)) setGa4Properties(ga4Data.properties);
        if (gtmRes.ok && Array.isArray(gtmData.account)) setGtmAccounts(gtmData.account);
      } catch (_) {}
    };
    fetchLists();
  }, [googleConnected, isSandboxMode, getToken]);

  useEffect(() => {
    if (!gtmAccountId) {
      setGtmContainers([]);
      return;
    }
    if (isSandboxMode) {
      setGtmContainers(SANDBOX_GTM_CONTAINERS[gtmAccountId] || []);
      return;
    }
    const loadContainers = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/gtm/containers?accountId=${gtmAccountId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        setGtmContainers(Array.isArray(data.container) ? data.container : []);
      } catch (_) {}
    };
    loadContainers();
  }, [gtmAccountId, isSandboxMode, getToken]);

  useEffect(() => {
    if (!gtmAccountId || !gtmContainerId) {
      setGtmWorkspaces([]);
      return;
    }
    if (isSandboxMode) {
      setGtmWorkspaces(SANDBOX_GTM_WORKSPACES[gtmContainerId] || []);
      return;
    }
    const loadWorkspaces = async () => {
      try {
        const token = await getToken();
        const res = await fetch(
          `/api/gtm/workspaces?accountId=${gtmAccountId}&containerId=${gtmContainerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json().catch(() => ({}));
        setGtmWorkspaces(Array.isArray(data.workspace) ? data.workspace : []);
      } catch (_) {}
    };
    loadWorkspaces();
  }, [gtmAccountId, gtmContainerId, isSandboxMode, getToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaveSuccess('');
    if (!name.trim()) {
      setErrorMsg('Project name cannot be empty.');
      return;
    }

    const ga4Obj = ga4Properties.find((p) => p.name === ga4PropertyId);
    const accObj = gtmAccounts.find((a) => a.accountId === gtmAccountId);
    const conObj = gtmContainers.find((c) => c.containerId === gtmContainerId);
    const wsObj = gtmWorkspaces.find((w) => w.workspaceId === gtmWorkspaceId);

    setSaving(true);
    try {
      const payload = {
        id: project.id,
        name: name.trim(),
        websiteUrl: websiteUrl.trim(),
        websiteType,
        ga4PropertyId: ga4PropertyId || null,
        ga4PropertyName: ga4Obj?.displayName || (ga4PropertyId === project.ga4_property_id ? project.ga4_property_name : ga4PropertyId) || null,
        gtmAccountId: gtmAccountId || null,
        gtmAccountName: accObj?.name || (gtmAccountId === project.gtm_account_id ? project.gtm_account_name : null) || null,
        gtmContainerId: gtmContainerId || null,
        gtmContainerName: conObj?.name || (gtmContainerId === project.gtm_container_id ? project.gtm_container_name : null) || null,
        gtmContainerPublicId: conObj?.publicId || (gtmContainerId === project.gtm_container_id ? project.gtm_container_public_id : null) || null,
        gtmWorkspaceId: gtmWorkspaceId || null,
        gtmWorkspaceName: wsObj?.name || (gtmWorkspaceId === project.gtm_workspace_id ? project.gtm_workspace_name : null) || null,
        measurementId: measurementId.trim() || null
      };

      if (isSandboxMode) {
        updateSandboxProject(project.id, {
          name: payload.name,
          website_url: payload.websiteUrl,
          website_type: payload.websiteType,
          ga4_property_id: payload.ga4PropertyId,
          ga4_property_name: payload.ga4PropertyName,
          gtm_account_id: payload.gtmAccountId,
          gtm_account_name: payload.gtmAccountName,
          gtm_container_id: payload.gtmContainerId,
          gtm_container_name: payload.gtmContainerName,
          gtm_container_public_id: payload.gtmContainerPublicId,
          gtm_workspace_id: payload.gtmWorkspaceId,
          gtm_workspace_name: payload.gtmWorkspaceName,
          measurement_id: payload.measurementId
        });
        await refreshWorkspace();
        setSaveSuccess('Project settings saved locally.');
        return;
      }

      const token = await getToken();
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update project settings');
      }
      await refreshWorkspace();
      setSaveSuccess('Project settings updated successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to update project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setErrorMsg('');
    try {
      if (isSandboxMode) {
        deleteSandboxProject(project.id);
        await refreshWorkspace();
        navigate('/organization');
        return;
      }

      const token = await getToken();
      const res = await fetch(`/api/projects?id=${encodeURIComponent(project.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete project');
      }
      await refreshWorkspace();
      navigate('/organization');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting project');
      setDeleting(false);
    }
  };

  return (
    <PageTransition locationKey={`project-settings-${project.id}`}>
      <BackgroundMesh />
      <div className="dashboard-container" style={{ maxWidth: '880px', margin: '0 auto' }}>
        <div className="dashboard-header">
          <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Sliders size={28} color="#00F0FF" />
            Project Settings — {project.name}
          </h1>
          <p className="dashboard-subtitle">
            Manage project details, linked GA4 Property, GTM Container bindings, or remove this project.
          </p>
        </div>

        {saveSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.9rem 1.15rem',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#A7F3D0',
              marginBottom: '1.25rem',
              fontSize: '0.9rem'
            }}
          >
            <CheckCircle2 size={18} color="#10B981" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.9rem 1.15rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#FCA5A5',
              marginBottom: '1.25rem',
              fontSize: '0.9rem'
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="module-card" style={{ padding: '1.75rem', cursor: 'default' }}>
          <h3 style={{ margin: '0 0 1.25rem', color: 'white', fontSize: '1.15rem' }}>General &amp; Website Identity</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1.1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="module-input"
                style={{ width: '100%' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Website URL
              </label>
              <div style={{ position: 'relative' }}>
                <Globe size={15} color="#6B7280" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="module-input"
                  style={{ width: '100%', paddingLeft: '2.15rem' }}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Industry Perspective
              </label>
              <select
                value={websiteType}
                onChange={(e) => setWebsiteType(e.target.value as WebsitePerspective)}
                className="module-input"
                style={{ width: '100%' }}
              >
                {WEBSITE_TYPES.map((wt) => (
                  <option key={wt.value} value={wt.value}>
                    {wt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1.15rem' }}>Google Analytics 4 &amp; GTM Bindings</h3>
            {!googleConnected && !isSandboxMode && (
              <a
                href={`/api/auth/google/login?clerkUserId=${encodeURIComponent(user?.id || '')}&returnTo=${encodeURIComponent(`/projects/${project.id}/settings`)}`}
                style={{ color: '#00F0FF', fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                Reconnect Google Account <ExternalLink size={14} />
              </a>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: '1.1rem', marginBottom: '1.75rem' }}>
            <div>
              <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Linked GA4 Property
              </label>
              <select
                value={ga4PropertyId}
                onChange={(e) => setGa4PropertyId(e.target.value)}
                className="module-input"
                style={{ width: '100%' }}
              >
                <option value="">None selected</option>
                {ga4Properties.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.displayName} ({p.name})
                  </option>
                ))}
                {ga4PropertyId && !ga4Properties.some((p) => p.name === ga4PropertyId) && (
                  <option value={ga4PropertyId}>
                    {project.ga4_property_name || ga4PropertyId}
                  </option>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Measurement ID
              </label>
              <input
                type="text"
                value={measurementId}
                onChange={(e) => setMeasurementId(e.target.value)}
                className="module-input"
                style={{ width: '100%' }}
                placeholder="G-XXXXXXXXXX"
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                GTM Account
              </label>
              <select
                value={gtmAccountId}
                onChange={(e) => {
                  setGtmAccountId(e.target.value);
                  setGtmContainerId('');
                  setGtmWorkspaceId('');
                }}
                className="module-input"
                style={{ width: '100%' }}
              >
                <option value="">Select Account...</option>
                {gtmAccounts.map((a) => (
                  <option key={a.accountId} value={a.accountId}>
                    {a.name}
                  </option>
                ))}
                {gtmAccountId && !gtmAccounts.some((a) => a.accountId === gtmAccountId) && (
                  <option value={gtmAccountId}>{project.gtm_account_name || gtmAccountId}</option>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                GTM Container
              </label>
              <select
                value={gtmContainerId}
                onChange={(e) => {
                  setGtmContainerId(e.target.value);
                  setGtmWorkspaceId('');
                }}
                className="module-input"
                style={{ width: '100%' }}
              >
                <option value="">Select Container...</option>
                {gtmContainers.map((c) => (
                  <option key={c.containerId} value={c.containerId}>
                    {c.name} ({c.publicId})
                  </option>
                ))}
                {gtmContainerId && !gtmContainers.some((c) => c.containerId === gtmContainerId) && (
                  <option value={gtmContainerId}>
                    {project.gtm_container_public_id || gtmContainerId}
                  </option>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                GTM Workspace
              </label>
              <select
                value={gtmWorkspaceId}
                onChange={(e) => setGtmWorkspaceId(e.target.value)}
                className="module-input"
                style={{ width: '100%' }}
              >
                <option value="">Select Workspace...</option>
                {gtmWorkspaces.map((w) => (
                  <option key={w.workspaceId} value={w.workspaceId}>
                    {w.name}
                  </option>
                ))}
                {gtmWorkspaceId && !gtmWorkspaces.some((w) => w.workspaceId === gtmWorkspaceId) && (
                  <option value={gtmWorkspaceId}>{project.gtm_workspace_name || gtmWorkspaceId}</option>
                )}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} className="btn-deploy-bulk" style={{ marginTop: 0 }}>
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={17} style={{ marginRight: '0.4rem' }} /> Saving...
                </>
              ) : (
                <>
                  <Save size={17} style={{ marginRight: '0.4rem' }} /> Save Project Changes
                </>
              )}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div
          className="module-card"
          style={{
            marginTop: '1.75rem',
            padding: '1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.04)',
            cursor: 'default'
          }}
        >
          <h3 style={{ margin: '0 0 0.4rem', color: '#FCA5A5', fontSize: '1.05rem' }}>Danger Zone</h3>
          <p style={{ margin: '0 0 1rem', color: '#9CA3AF', fontSize: '0.85rem' }}>
            Deleting this project removes it from your organization and deletes GA4 Observer monitors scoped directly to it. Your actual Google Analytics and GTM accounts remain untouched.
          </p>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                background: 'rgba(239, 68, 68, 0.14)',
                color: '#FCA5A5',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Trash2 size={15} /> Delete Project
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '0.6rem 1.15rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#DC2626',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {deleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                Confirm Permanent Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: 'transparent',
                  color: '#D1D5DB',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};
