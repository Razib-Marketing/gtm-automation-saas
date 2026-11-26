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
  Loader2,
  Building2,
  UserPlus,
  Users,
  LayoutGrid,
  List,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { PageTransition } from '../components/ui/PageTransition';
import { useWorkspace } from '../context/WorkspaceContext';
import { WEBSITE_TYPES, getWebsiteTypeMeta } from '../types/project';
import type { Project, WebsitePerspective, AccessRole, ProjectAccessGrant } from '../types/project';
import {
  resetSandboxToNewUser,
  seedSandboxSampleProjects,
  updateSandboxProject,
  trashSandboxProject,
  restoreSandboxProject,
  deleteSandboxProject,
  emptySandboxTrash,
  addSandboxOrganization,
  assignSandboxProjectsToOrg,
  grantSandboxProjectAccess,
  revokeSandboxProjectAccess,
  getSandboxState
} from '../utils/localDemoStore';
import './Dashboard.css';
import './OrganizationDashboard.css';

export const OrganizationDashboard: React.FC = () => {
  const {
    organizations,
    projects,
    trashedProjects,
    activeOrgId,
    setActiveOrgId,
    userTier,
    isSandboxMode,
    refreshWorkspace
  } = useWorkspace();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<'all' | 'healthy' | 'attention' | 'unmonitored'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Quick Edit Project Modal state
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editType, setEditType] = useState<WebsitePerspective>('general');
  const [editOrgId, setEditOrgId] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Move to Trash Modal state
  const [projectToTrash, setProjectToTrash] = useState<Project | null>(null);
  const [trashing, setTrashing] = useState(false);
  const [trashError, setTrashError] = useState('');

  // Permanent Delete Modal state
  const [projectToPermDelete, setProjectToPermDelete] = useState<Project | null>(null);
  const [permDeleting, setPermDeleting] = useState(false);
  const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Share / Grant Access Modal state (works for single or bulk selected projects)
  const [shareTargetProjects, setShareTargetProjects] = useState<Project[]>([]);
  const [shareEmails, setShareEmails] = useState('');
  const [shareRole, setShareRole] = useState<AccessRole>('editor');
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');
  const [existingGrants, setExistingGrants] = useState<ProjectAccessGrant[]>([]);
  const [loadingGrants, setLoadingGrants] = useState(false);

  // Create Organization Modal state
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Bulk assign org state
  const [bulkOrgTarget, setBulkOrgTarget] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const isTrashView = activeOrgId === 'trash';

  const params = new URLSearchParams(location.search);
  const createdProjectId = params.get('created');
  const createdProject = createdProjectId
    ? projects.find((p) => p.id === createdProjectId)
    : undefined;

  const personalCount = useMemo(
    () => projects.filter((p) => !p.organization_id && (p.accessSource || 'owner') === 'owner').length,
    [projects]
  );
  const sharedCount = useMemo(
    () => projects.filter((p) => p.accessSource && p.accessSource !== 'owner').length,
    [projects]
  );

  const scopedProjects = useMemo(() => {
    if (isTrashView) return trashedProjects;
    if (activeOrgId === 'all') return projects;
    if (activeOrgId === 'personal') {
      return projects.filter((p) => !p.organization_id && (p.accessSource || 'owner') === 'owner');
    }
    if (activeOrgId === 'shared') {
      return projects.filter((p) => p.accessSource && p.accessSource !== 'owner');
    }
    return projects.filter((p) => p.organization_id === activeOrgId);
  }, [projects, trashedProjects, activeOrgId, isTrashView]);

  const filteredProjects = useMemo(() => {
    return scopedProjects.filter((p) => {
      const matchesType = filterType === 'all' || (p.website_type || 'general') === filterType;
      if (!matchesType) return false;

      if (!isTrashView && healthFilter !== 'all') {
        const gtm = p.latestGtmScore;
        const ga4 = p.latestGa4Score;
        if (healthFilter === 'healthy') {
          const hasHigh =
            (typeof gtm === 'number' && gtm >= 90) || (typeof ga4 === 'number' && ga4 >= 90);
          const hasLow =
            (typeof gtm === 'number' && gtm < 90) || (typeof ga4 === 'number' && ga4 < 90);
          if (!hasHigh || hasLow) return false;
        } else if (healthFilter === 'attention') {
          const needs =
            (typeof gtm === 'number' && gtm < 85) || (typeof ga4 === 'number' && ga4 < 85);
          if (!needs) return false;
        } else if (healthFilter === 'unmonitored') {
          if ((p.monitorCount || 0) > 0) return false;
        }
      }

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.website_url || '').toLowerCase().includes(q) ||
        (p.gtm_container_public_id || '').toLowerCase().includes(q) ||
        (p.ga4_property_name || '').toLowerCase().includes(q) ||
        (p.organization_name || '').toLowerCase().includes(q)
      );
    });
  }, [scopedProjects, filterType, healthFilter, searchQuery, isTrashView]);

  const activeScopeStatsSource = isTrashView ? projects : scopedProjects;
  const totalGa4Linked = activeScopeStatsSource.filter((p) => Boolean(p.ga4_property_id)).length;
  const totalGtmLinked = activeScopeStatsSource.filter((p) => Boolean(p.gtm_container_id || p.gtm_container_public_id)).length;
  const totalMonitors = activeScopeStatsSource.reduce((sum, p) => sum + (p.monitorCount || 0), 0);

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

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAllFiltered = () => {
    const visibleIds = filteredProjects.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleOpenEdit = (project: Project) => {
    setProjectToEdit(project);
    setEditName(project.name || '');
    setEditUrl(project.website_url || '');
    setEditType((project.website_type as WebsitePerspective) || 'general');
    setEditOrgId(project.organization_id || '');
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
          website_type: editType,
          organization_id: editOrgId || null
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
          websiteType: editType,
          organizationId: editOrgId || null
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

  const handleConfirmTrash = async () => {
    if (!projectToTrash) return;
    setTrashing(true);
    setTrashError('');
    try {
      if (isSandboxMode) {
        trashSandboxProject(projectToTrash.id);
        await refreshWorkspace();
        setSelectedIds((prev) => prev.filter((id) => id !== projectToTrash.id));
        setProjectToTrash(null);
        return;
      }
      const token = await getToken();
      const res = await fetch(`/api/projects?id=${encodeURIComponent(projectToTrash.id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to move project to trash');
      }
      await refreshWorkspace();
      setSelectedIds((prev) => prev.filter((id) => id !== projectToTrash.id));
      setProjectToTrash(null);
    } catch (err: any) {
      setTrashError(err.message || 'Error moving project to trash');
    } finally {
      setTrashing(false);
    }
  };

  const handleRestoreProject = async (project: Project) => {
    setRestoringId(project.id);
    try {
      if (isSandboxMode) {
        restoreSandboxProject(project.id);
        await refreshWorkspace();
        return;
      }
      const token = await getToken();
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: project.id, action: 'restore', restoreMonitors: true })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Failed to restore project');
      } else {
        await refreshWorkspace();
      }
    } finally {
      setRestoringId(null);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!projectToPermDelete) return;
    setPermDeleting(true);
    try {
      if (isSandboxMode) {
        deleteSandboxProject(projectToPermDelete.id);
        await refreshWorkspace();
        setProjectToPermDelete(null);
        return;
      }
      const token = await getToken();
      const res = await fetch(`/api/projects?id=${encodeURIComponent(projectToPermDelete.id)}&permanent=true`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Failed to permanently delete project');
      } else {
        await refreshWorkspace();
        setProjectToPermDelete(null);
      }
    } finally {
      setPermDeleting(false);
    }
  };

  const handleEmptyTrash = async () => {
    setPermDeleting(true);
    try {
      if (isSandboxMode) {
        emptySandboxTrash();
        await refreshWorkspace();
        setEmptyTrashConfirm(false);
        return;
      }
      const token = await getToken();
      const res = await fetch('/api/projects?emptyTrash=true', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Failed to empty trash');
      } else {
        await refreshWorkspace();
        setEmptyTrashConfirm(false);
      }
    } finally {
      setPermDeleting(false);
    }
  };

  const openShareModal = async (targetProjects: Project[]) => {
    setShareTargetProjects(targetProjects);
    setShareEmails('');
    setShareRole('editor');
    setShareError('');
    setShareSuccess('');
    setExistingGrants([]);

    if (targetProjects.length === 1) {
      const pid = targetProjects[0].id;
      if (isSandboxMode) {
        const s = getSandboxState();
        setExistingGrants((s.projectAccess || []).filter((g) => g.project_id === pid));
        return;
      }
      setLoadingGrants(true);
      try {
        const token = await getToken();
        const res = await fetch(`/api/access?projectId=${encodeURIComponent(pid)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.grants)) {
          setExistingGrants(data.grants);
        }
      } finally {
        setLoadingGrants(false);
      }
    }
  };

  const handleSubmitShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (shareTargetProjects.length === 0) return;
    const emails = Array.from(
      new Set(
        shareEmails
          .split(/[,;\s\n]+/)
          .map((em) => em.toLowerCase().trim())
          .filter((em) => em.includes('@'))
      )
    );
    if (emails.length === 0) {
      setShareError('Please enter at least one valid email address.');
      return;
    }

    setSharing(true);
    setShareError('');
    setShareSuccess('');
    try {
      const pids = shareTargetProjects.map((p) => p.id);
      if (isSandboxMode) {
        grantSandboxProjectAccess(pids, emails, shareRole);
        if (pids.length === 1) {
          const s = getSandboxState();
          setExistingGrants((s.projectAccess || []).filter((g) => g.project_id === pids[0]));
        }
        setShareEmails('');
        setShareSuccess(`Granted ${shareRole} access to ${emails.join(', ')}.`);
        await refreshWorkspace();
        return;
      }

      const token = await getToken();
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          projectIds: pids,
          emails,
          role: shareRole,
          sendEmail: true
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to grant access');

      setShareEmails('');
      setShareSuccess(`Access granted to ${emails.join(', ')}.`);
      if (pids.length === 1) {
        const gRes = await fetch(`/api/access?projectId=${encodeURIComponent(pids[0])}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const gData = await gRes.json().catch(() => ({}));
        if (gRes.ok && Array.isArray(gData.grants)) setExistingGrants(gData.grants);
      }
      await refreshWorkspace();
    } catch (err: any) {
      setShareError(err.message || 'Unable to grant access');
    } finally {
      setSharing(false);
    }
  };

  const handleRevokeGrantInModal = async (grantId: string) => {
    if (isSandboxMode) {
      revokeSandboxProjectAccess(grantId);
      setExistingGrants((prev) => prev.filter((g) => g.id !== grantId));
      await refreshWorkspace();
      return;
    }
    const token = await getToken();
    const res = await fetch(`/api/access?id=${encodeURIComponent(grantId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setExistingGrants((prev) => prev.filter((g) => g.id !== grantId));
      await refreshWorkspace();
    }
  };

  const handleCreateOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreatingOrg(true);
    try {
      if (isSandboxMode) {
        const created = addSandboxOrganization({ name: newOrgName.trim(), description: newOrgDesc.trim() });
        setNewOrgName('');
        setNewOrgDesc('');
        setShowCreateOrgModal(false);
        setActiveOrgId(created.id);
        await refreshWorkspace();
        return;
      }
      const token = await getToken();
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newOrgName.trim(), description: newOrgDesc.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create organization');
      setNewOrgName('');
      setNewOrgDesc('');
      setShowCreateOrgModal(false);
      if (data.organization?.id) setActiveOrgId(data.organization.id);
      await refreshWorkspace();
    } catch (err: any) {
      alert(err.message || 'Unable to create organization');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleBulkAssignOrg = async () => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    try {
      const targetOrgId = bulkOrgTarget || null;
      if (isSandboxMode) {
        assignSandboxProjectsToOrg(selectedIds, targetOrgId);
        setSelectedIds([]);
        await refreshWorkspace();
        return;
      }
      const token = await getToken();
      const res = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'assign_projects',
          projectIds: selectedIds,
          organizationId: targetOrgId
        })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Bulk assign failed');
      } else {
        setSelectedIds([]);
        await refreshWorkspace();
      }
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkMoveToTrash = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Move ${selectedIds.length} selected project(s) to Trash? All active GA4 monitors for these projects will be closed immediately.`)) {
      return;
    }
    setBulkProcessing(true);
    try {
      if (isSandboxMode) {
        selectedIds.forEach((id) => trashSandboxProject(id));
        setSelectedIds([]);
        await refreshWorkspace();
        return;
      }
      const token = await getToken();
      await Promise.all(
        selectedIds.map((pid) =>
          fetch(`/api/projects?id=${encodeURIComponent(pid)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      setSelectedIds([]);
      await refreshWorkspace();
    } finally {
      setBulkProcessing(false);
    }
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
                <strong>Local Test Sandbox:</strong> Test Billing, Organizations, 50-Site Table View, Universal Sharing &amp; Trash locally.
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
                <CreditCard size={13} /> Test Fresh Customer (Billing &rarr; Onboarding)
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
                  border: '1px solid rgba(0, 240, 255, 0.35)',
                  background: 'rgba(0, 240, 255, 0.1)',
                  color: '#00F0FF',
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

        {/* Newly Created Project Welcome Banner */}
        {createdProject && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
              padding: '0.95rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#6EE7B7', fontSize: '0.92rem' }}>
              <CheckCircle2 size={20} />
              <span>
                <strong>{createdProject.name}</strong> has been created and added to your Organization Dashboard.
              </span>
            </div>
            <Link
              to={`/projects/${createdProject.id}/dashboard`}
              className="btn-deploy-bulk"
              style={{ marginTop: 0, textDecoration: 'none', padding: '0.5rem 1rem', fontSize: '0.84rem' }}
            >
              Enter Project Workspace &rarr;
            </Link>
          </motion.div>
        )}

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                background: 'rgba(0, 240, 255, 0.08)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                color: '#00F0FF',
                fontSize: '0.73rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                marginBottom: '0.6rem'
              }}
            >
              <Layers size={13} />
              ORGANIZATION LEVEL • {userTier.toUpperCase()} PLAN
            </div>
            <h1 className="dashboard-title">Organization Dashboard</h1>
            <p className="dashboard-subtitle">
              Manage 50+ client websites organized by company, share universal access with anyone, or manage closed projects in Trash.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <Link
              to="/access"
              className="org-btn-secondary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <ShieldCheck size={16} color="#00F0FF" />
              Access &amp; Teams
            </Link>
            <Link
              to="/onboarding"
              className="btn-deploy-bulk"
              style={{ marginTop: 0, textDecoration: 'none', padding: '0.72rem 1.25rem' }}
            >
              <PlusCircle size={17} style={{ marginRight: '0.45rem' }} />
              New Project Setup
            </Link>
          </div>
        </motion.div>

        {/* Organization Switcher & Trash Bar */}
        <div className="org-switcher-bar">
          <div className="org-scope-pills">
            <button
              type="button"
              className={`org-scope-pill ${activeOrgId === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveOrgId('all');
                setSelectedIds([]);
              }}
            >
              <Layers size={13} /> All Projects <span className="org-count-badge">{projects.length}</span>
            </button>

            <button
              type="button"
              className={`org-scope-pill ${activeOrgId === 'personal' ? 'active' : ''}`}
              onClick={() => {
                setActiveOrgId('personal');
                setSelectedIds([]);
              }}
            >
              Personal <span className="org-count-badge">{personalCount}</span>
            </button>

            {organizations.map((org) => (
              <button
                key={org.id}
                type="button"
                className={`org-scope-pill ${activeOrgId === org.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveOrgId(org.id);
                  setSelectedIds([]);
                }}
              >
                <Building2 size={13} /> {org.name}{' '}
                <span className="org-count-badge">
                  {projects.filter((p) => p.organization_id === org.id).length}
                </span>
              </button>
            ))}

            {sharedCount > 0 && (
              <button
                type="button"
                className={`org-scope-pill ${activeOrgId === 'shared' ? 'active' : ''}`}
                onClick={() => {
                  setActiveOrgId('shared');
                  setSelectedIds([]);
                }}
              >
                <Users size={13} /> Shared With Me <span className="org-count-badge">{sharedCount}</span>
              </button>
            )}

            <button
              type="button"
              className={`org-scope-pill trash-pill ${activeOrgId === 'trash' ? 'active' : ''}`}
              onClick={() => {
                setActiveOrgId('trash');
                setSelectedIds([]);
              }}
            >
              <Trash2 size={13} /> Trash <span className="org-count-badge">{trashedProjects.length}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateOrgModal(true)}
            className="org-scope-pill"
            style={{ borderColor: 'rgba(0, 240, 255, 0.35)', color: '#00F0FF', background: 'rgba(0, 240, 255, 0.08)' }}
          >
            <Plus size={13} /> New Organization
          </button>
        </div>

        {/* Org KPI Strip */}
        <div className="org-kpi-grid">
          {[
            {
              label: isTrashView ? 'All Active Projects' : 'Scoped Projects',
              value: activeScopeStatsSource.length,
              badge: activeScopeStatsSource.length === 1 ? '1 Active' : `${activeScopeStatsSource.length} Active`,
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
                <div className="org-kpi-icon-wrapper">{stat.icon}</div>
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

        {/* TRASH BANNER OR SEARCH & FILTER BAR */}
        {isTrashView ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
              padding: '1rem 1.25rem',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.28)',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#FCA5A5', fontSize: '0.86rem' }}>
              <Trash2 size={18} color="#EF4444" />
              <span>
                <strong>Trash &amp; Closed Monitors:</strong> Every project moved to Trash immediately stops all automated GA4 Observer alerts. Restore anytime or delete permanently.
              </span>
            </div>
            {trashedProjects.length > 0 && (
              <button
                type="button"
                onClick={() => setEmptyTrashConfirm(true)}
                className="org-btn-danger"
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
              >
                <Trash2 size={14} /> Empty Trash ({trashedProjects.length})
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Search, Filter & 50-Site View Mode */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.85rem',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', flex: '1 1 320px' }}>
                <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 240px', maxWidth: '340px' }}>
                  <Search size={16} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="search"
                    placeholder="Search websites, GTM ID, GA4, org..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="module-input"
                    style={{ width: '100%', paddingLeft: '2.35rem' }}
                  />
                </div>

                <select
                  value={healthFilter}
                  onChange={(e) => setHealthFilter(e.target.value as any)}
                  className="module-input"
                  style={{ fontSize: '0.82rem', padding: '0.55rem 0.85rem' }}
                  aria-label="Filter by health"
                >
                  <option value="all">Health: All</option>
                  <option value="healthy">Healthy (&ge;90%)</option>
                  <option value="attention">Needs Attention (&lt;85%)</option>
                  <option value="unmonitored">No Active Monitors</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    style={{
                      padding: '0.42rem 0.8rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: filterType === 'all' ? '1px solid #00F0FF' : '1px solid rgba(255,255,255,0.1)',
                      background: filterType === 'all' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                      color: filterType === 'all' ? '#00F0FF' : '#9CA3AF'
                    }}
                  >
                    All ({scopedProjects.length})
                  </button>
                  {WEBSITE_TYPES.filter((wt) => wt.value !== 'general').map((wt) => (
                    <button
                      key={wt.value}
                      type="button"
                      onClick={() => setFilterType(wt.value)}
                      style={{
                        padding: '0.42rem 0.8rem',
                        borderRadius: '9999px',
                        fontSize: '0.78rem',
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

                <div className="org-view-toggle" role="group" aria-label="Layout view">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`org-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    title="Card Grid View"
                  >
                    <LayoutGrid size={14} /> Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`org-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    title="50-Site Table View"
                  >
                    <List size={14} /> Table
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Selection Action Bar */}
            {selectedIds.length > 0 && (
              <div className="org-bulk-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#E5E7EB', fontSize: '0.86rem', fontWeight: 600 }}>
                  <span style={{ color: '#00F0FF' }}>{selectedIds.length} website(s) selected</span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}
                  >
                    Clear
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                  <select
                    value={bulkOrgTarget}
                    onChange={(e) => setBulkOrgTarget(e.target.value)}
                    className="module-input"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}
                  >
                    <option value="">Personal Workspace</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        Move to: {org.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={bulkProcessing}
                    onClick={handleBulkAssignOrg}
                    className="org-btn-secondary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    Assign Org
                  </button>
                  <button
                    type="button"
                    disabled={bulkProcessing}
                    onClick={() => openShareModal(projects.filter((p) => selectedIds.includes(p.id)))}
                    className="org-btn-primary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                  >
                    <UserPlus size={14} /> Grant Access
                  </button>
                  <button
                    type="button"
                    disabled={bulkProcessing}
                    onClick={handleBulkMoveToTrash}
                    className="org-btn-danger"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    <Trash2 size={14} /> Move to Trash
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* MAIN CONTENT AREA */}
        {isTrashView ? (
          trashedProjects.length === 0 ? (
            <div className="module-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#9CA3AF', cursor: 'default' }}>
              <Trash2 size={32} color="#6B7280" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#E5E7EB', marginBottom: '0.25rem' }}>Trash is Empty</div>
              <div style={{ fontSize: '0.84rem' }}>Deleted projects will appear here with their monitors paused so you can restore them anytime.</div>
            </div>
          ) : (
            <div className="org-table-container">
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Project / Website</th>
                    <th>Organization</th>
                    <th>Closed Monitors</th>
                    <th>Moved to Trash</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trashedProjects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{project.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                          {project.website_url ? project.website_url.replace(/^https?:\/\//, '') : 'No domain'} • {project.gtm_container_public_id || 'No GTM'}
                        </div>
                      </td>
                      <td style={{ color: '#9CA3AF' }}>{project.organization_name || 'Personal'}</td>
                      <td>
                        <span
                          className="org-score-pill"
                          style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#FCA5A5',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                          }}
                        >
                          {project.monitorCount || 0} Monitors Closed
                        </span>
                      </td>
                      <td style={{ color: '#9CA3AF', fontSize: '0.78rem' }}>
                        {project.deleted_at ? new Date(project.deleted_at).toLocaleString() : 'Recently'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            disabled={restoringId === project.id}
                            onClick={() => handleRestoreProject(project)}
                            className="org-btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#6EE7B7', borderColor: 'rgba(16, 185, 129, 0.35)' }}
                          >
                            {restoringId === project.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => setProjectToPermDelete(project)}
                            className="org-btn-danger"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                          >
                            <Trash2 size={13} /> Delete Forever
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : projects.length === 0 ? (
          <div className="oauth-card" style={{ maxWidth: '580px', margin: '2rem auto', textAlign: 'center', padding: '2.5rem' }}>
            <Sparkles size={40} color="#00F0FF" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Create Your First Project</h2>
            <p style={{ color: '#9CA3AF', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
              Your organization is active! Launch guided onboarding to connect Google Analytics 4, link Google Tag Manager, and set initial anomaly triggers.
            </p>
            <Link to="/onboarding" className="btn-deploy-bulk" style={{ textDecoration: 'none', marginTop: 0 }}>
              Launch Project Onboarding &rarr;
            </Link>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="module-card" style={{ padding: '2.5rem', textAlign: 'center', color: '#9CA3AF', cursor: 'default' }}>
            No projects match your current search, organization, or health filter.
          </div>
        ) : viewMode === 'table' ? (
          /* 50-SITE HIGH-DENSITY TABLE VIEW */
          <div className="org-table-container">
            <table className="org-table">
              <thead>
                <tr>
                  <th style={{ width: '36px' }}>
                    <input
                      type="checkbox"
                      checked={filteredProjects.length > 0 && filteredProjects.every((p) => selectedIds.includes(p.id))}
                      onChange={toggleSelectAllFiltered}
                      aria-label="Select all visible websites"
                    />
                  </th>
                  <th>Website / Project</th>
                  <th>Organization</th>
                  <th>GA4 &amp; GTM Bindings</th>
                  <th>Monitors &amp; Health</th>
                  <th>Access</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const typeMeta = getWebsiteTypeMeta(project.website_type);
                  const gtmCol = getScoreColor(project.latestGtmScore);
                  const ga4Col = getScoreColor(project.latestGa4Score);
                  return (
                    <tr key={project.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(project.id)}
                          onChange={() => toggleSelectId(project.id)}
                          aria-label={`Select ${project.name}`}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{project.name}</span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              color: typeMeta.color,
                              background: `${typeMeta.color}18`,
                              padding: '0.1rem 0.45rem',
                              borderRadius: '9999px'
                            }}
                          >
                            {typeMeta.badge}
                          </span>
                        </div>
                        {project.website_url && (
                          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.15rem' }}>
                            {project.website_url.replace(/^https?:\/\//, '')}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: project.organization_name ? '#00F0FF' : '#9CA3AF', fontWeight: 600 }}>
                          {project.organization_name || 'Personal'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.78rem', color: '#E5E7EB' }}>
                          {project.ga4_property_name || project.ga4_property_id || 'GA4 Unlinked'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#00F0FF', fontFamily: 'monospace' }}>
                          {project.gtm_container_public_id || 'GTM Unlinked'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <span
                            className="org-score-pill"
                            style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#7DD3FC', border: '1px solid rgba(56, 189, 248, 0.25)' }}
                          >
                            {project.monitorCount || 0} Mon
                          </span>
                          <span
                            className="org-score-pill"
                            style={{ background: gtmCol.bg, color: gtmCol.color, border: `1px solid ${gtmCol.border}` }}
                          >
                            GTM {typeof project.latestGtmScore === 'number' ? `${project.latestGtmScore}%` : '—'}
                          </span>
                          <span
                            className="org-score-pill"
                            style={{ background: ga4Col.bg, color: ga4Col.color, border: `1px solid ${ga4Col.border}` }}
                          >
                            GA4 {typeof project.latestGa4Score === 'number' ? `${project.latestGa4Score}%` : '—'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.76rem', color: '#E5E7EB' }}>
                          {project.accessSource === 'owner'
                            ? project.sharedWithCount
                              ? `Owner • ${project.sharedWithCount} shared`
                              : 'Owner'
                            : `${project.accessSource} (${project.accessRole})`}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="org-project-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => openShareModal([project])}
                            title="Share / Grant Access"
                            className="org-action-btn share-btn"
                          >
                            <UserPlus size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(project)}
                            title="Quick Edit"
                            className="org-action-btn edit-btn"
                          >
                            <Pencil size={14} />
                          </button>
                          <Link
                            to={`/projects/${project.id}/settings`}
                            title="Project Settings"
                            className="org-action-btn settings-btn"
                          >
                            <Sliders size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setProjectToTrash(project)}
                            title="Move to Trash"
                            className="org-action-btn delete-btn"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                            className="org-btn-primary"
                            style={{ padding: '0.38rem 0.72rem', fontSize: '0.76rem' }}
                          >
                            Open &rarr;
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARD GRID VIEW */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
              gap: '1.25rem'
            }}
          >
            {filteredProjects.map((project, idx) => {
              const typeMeta = getWebsiteTypeMeta(project.website_type);
              const gtmCol = getScoreColor(project.latestGtmScore);
              const ga4Col = getScoreColor(project.latestGa4Score);
              const isSelected = selectedIds.includes(project.id);
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx, 12) * 0.03 }}
                  className="org-project-card"
                  style={isSelected ? { borderColor: '#00F0FF', boxShadow: '0 0 24px rgba(0, 240, 255, 0.16)' } : undefined}
                >
                  <div>
                    <div className="org-project-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectId(project.id)}
                            aria-label={`Select ${project.name}`}
                            style={{ cursor: 'pointer' }}
                          />
                          <span
                            className="org-project-badge"
                            style={{
                              marginBottom: 0,
                              color: typeMeta.color,
                              background: `${typeMeta.color}18`,
                              border: `1px solid ${typeMeta.color}40`
                            }}
                          >
                            {typeMeta.badge}
                          </span>
                          {project.organization_name && (
                            <span
                              className="org-project-badge"
                              style={{
                                marginBottom: 0,
                                color: '#00F0FF',
                                background: 'rgba(0, 240, 255, 0.1)',
                                border: '1px solid rgba(0, 240, 255, 0.25)'
                              }}
                            >
                              {project.organization_name}
                            </span>
                          )}
                          {project.accessSource && project.accessSource !== 'owner' && (
                            <span
                              className="org-project-badge"
                              style={{
                                marginBottom: 0,
                                color: '#D8B4FE',
                                background: 'rgba(168, 85, 247, 0.12)',
                                border: '1px solid rgba(168, 85, 247, 0.3)'
                              }}
                            >
                              Shared • {project.accessRole}
                            </span>
                          )}
                        </div>
                        <h3 className="org-project-title">{project.name}</h3>
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
                          onClick={() => openShareModal([project])}
                          title="Share / Grant Access"
                          aria-label="Share Project"
                          className="org-action-btn share-btn"
                        >
                          <UserPlus size={14} />
                        </button>
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
                          onClick={() => setProjectToTrash(project)}
                          title="Move Project to Trash"
                          aria-label="Move Project to Trash"
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
                      {(project.sharedWithCount || 0) > 0 && (
                        <span
                          className="org-score-pill"
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#6EE7B7',
                            border: '1px solid rgba(16, 185, 129, 0.25)'
                          }}
                        >
                          <Users size={11} /> {project.sharedWithCount} shared
                        </span>
                      )}
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
                  <label className="org-modal-label">Client Organization</label>
                  <select
                    value={editOrgId}
                    onChange={(e) => setEditOrgId(e.target.value)}
                    className="module-input"
                    style={{ width: '100%' }}
                  >
                    <option value="">Personal Workspace</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
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

      {/* Move to Trash Confirmation Modal */}
      <AnimatePresence>
        {projectToTrash && (
          <div className="org-modal-overlay" onClick={() => !trashing && setProjectToTrash(null)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="org-modal-card"
              style={{ maxWidth: '470px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="org-modal-header" style={{ borderBottomColor: 'rgba(245, 158, 11, 0.25)' }}>
                <h3 className="org-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FCD34D' }}>
                  <Trash2 size={20} /> Move Project to Trash
                </h3>
                <button
                  type="button"
                  className="org-modal-close-btn"
                  onClick={() => !trashing && setProjectToTrash(null)}
                  aria-label="Close"
                  disabled={trashing}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="org-modal-body">
                {trashError && (
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
                    {trashError}
                  </div>
                )}

                <p style={{ margin: '0 0 0.85rem', color: '#FFFFFF', fontSize: '1rem', fontWeight: 600 }}>
                  Move <span style={{ color: '#00F0FF' }}>&ldquo;{projectToTrash.name}&rdquo;</span> to Trash?
                </p>

                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.85rem', lineHeight: 1.55 }}>
                  All active GA4 Observer monitors for this project will be <strong>closed immediately</strong> so no automated alert emails are triggered. You can restore the project anytime from the <strong>Trash</strong> tab or delete it permanently there.
                </p>

                <div className="org-modal-actions">
                  <button
                    type="button"
                    className="org-btn-secondary"
                    onClick={() => setProjectToTrash(null)}
                    disabled={trashing}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="org-btn-danger"
                    onClick={handleConfirmTrash}
                    disabled={trashing}
                  >
                    {trashing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Moving...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} /> Move to Trash
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Permanent Delete Modal */}
      <AnimatePresence>
        {(projectToPermDelete || emptyTrashConfirm) && (
          <div
            className="org-modal-overlay"
            onClick={() => {
              if (!permDeleting) {
                setProjectToPermDelete(null);
                setEmptyTrashConfirm(false);
              }
            }}
          >
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
              <div className="org-modal-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.25)' }}>
                <h3 className="org-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444' }}>
                  <AlertTriangle size={20} /> {emptyTrashConfirm ? 'Empty Trash Permanently' : 'Delete Project Forever'}
                </h3>
                <button
                  type="button"
                  className="org-modal-close-btn"
                  onClick={() => {
                    if (!permDeleting) {
                      setProjectToPermDelete(null);
                      setEmptyTrashConfirm(false);
                    }
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="org-modal-body">
                <p style={{ margin: '0 0 0.75rem', color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 600 }}>
                  {emptyTrashConfirm
                    ? `Permanently delete all ${trashedProjects.length} trashed project(s)?`
                    : `Permanently delete "${projectToPermDelete?.name}"?`}
                </p>
                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.84rem', lineHeight: 1.5 }}>
                  This permanently erases the project, closed GA4 monitors, alert logs, audit history, and shared access grants. This action cannot be undone.
                </p>
                <div className="org-modal-actions">
                  <button
                    type="button"
                    className="org-btn-secondary"
                    onClick={() => {
                      setProjectToPermDelete(null);
                      setEmptyTrashConfirm(false);
                    }}
                    disabled={permDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="org-btn-danger"
                    disabled={permDeleting}
                    onClick={emptyTrashConfirm ? handleEmptyTrash : handleConfirmPermanentDelete}
                  >
                    {permDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    Confirm Permanent Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Share / Universal Access Modal */}
      <AnimatePresence>
        {shareTargetProjects.length > 0 && (
          <div className="org-modal-overlay" onClick={() => !sharing && setShareTargetProjects([])}>
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="org-modal-card"
              style={{ maxWidth: '540px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="org-modal-header">
                <h3 className="org-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={19} color="#00F0FF" />
                  {shareTargetProjects.length === 1
                    ? `Share "${shareTargetProjects[0].name}"`
                    : `Share ${shareTargetProjects.length} Selected Websites`}
                </h3>
                <button
                  type="button"
                  className="org-modal-close-btn"
                  onClick={() => !sharing && setShareTargetProjects([])}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="org-modal-body">
                {shareError && (
                  <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#FCA5A5', fontSize: '0.82rem', marginBottom: '1rem' }}>
                    {shareError}
                  </div>
                )}
                {shareSuccess && (
                  <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#6EE7B7', fontSize: '0.82rem', marginBottom: '1rem' }}>
                    {shareSuccess}
                  </div>
                )}

                <form onSubmit={handleSubmitShare}>
                  <div className="org-modal-field">
                    <label className="org-modal-label">Collaborator Email(s)</label>
                    <input
                      type="text"
                      required
                      value={shareEmails}
                      onChange={(e) => setShareEmails(e.target.value)}
                      placeholder="client@hotel.com, analyst@agency.com"
                      className="module-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div className="org-modal-field">
                    <label className="org-modal-label">Access Role</label>
                    <select
                      value={shareRole}
                      onChange={(e) => setShareRole(e.target.value as AccessRole)}
                      className="module-input"
                      style={{ width: '100%' }}
                    >
                      <option value="admin">Admin — Full workspace &amp; team management</option>
                      <option value="editor">Editor — Deploy tags, run audits &amp; manage monitors</option>
                      <option value="viewer">Viewer — Read-only reports &amp; PDF exports</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={sharing}
                    className="org-btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {sharing ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                    Grant Access &amp; Send Invite
                  </button>
                </form>

                {shareTargetProjects.length === 1 && (
                  <div style={{ marginTop: '1.35rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#E5E7EB', marginBottom: '0.6rem' }}>
                      People with direct access ({existingGrants.length})
                    </div>
                    {loadingGrants ? (
                      <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Loading access list...</div>
                    ) : existingGrants.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>No individual collaborators granted yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '160px', overflowY: 'auto' }}>
                        {existingGrants.map((g) => (
                          <div
                            key={g.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.45rem 0.65rem',
                              borderRadius: '8px',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              fontSize: '0.8rem'
                            }}
                          >
                            <div>
                              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{g.granted_to_email}</span>
                              <span style={{ marginLeft: '0.5rem', color: '#00F0FF', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700 }}>
                                {g.role}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRevokeGrantInModal(g.id)}
                              className="org-action-btn delete-btn"
                              title="Revoke access"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Organization Modal */}
      <AnimatePresence>
        {showCreateOrgModal && (
          <div className="org-modal-overlay" onClick={() => !creatingOrg && setShowCreateOrgModal(false)}>
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
                <h3 className="org-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={19} color="#00F0FF" /> Create Client Organization
                </h3>
                <button
                  type="button"
                  className="org-modal-close-btn"
                  onClick={() => !creatingOrg && setShowCreateOrgModal(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateOrgSubmit} className="org-modal-body">
                <div className="org-modal-field">
                  <label className="org-modal-label">Organization / Management Company Name</label>
                  <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="e.g. Cogwheel Hospitality Portfolio"
                    className="module-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="org-modal-field">
                  <label className="org-modal-label">Description (Optional)</label>
                  <input
                    type="text"
                    value={newOrgDesc}
                    onChange={(e) => setNewOrgDesc(e.target.value)}
                    placeholder="50 managed hotel websites"
                    className="module-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="org-modal-actions">
                  <button
                    type="button"
                    className="org-btn-secondary"
                    onClick={() => setShowCreateOrgModal(false)}
                    disabled={creatingOrg}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="org-btn-primary" disabled={creatingOrg}>
                    {creatingOrg ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                    Create Organization
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};
