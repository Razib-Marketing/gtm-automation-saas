import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
  Building2,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Loader2,
  ArrowRight,
  UserPlus,
  Users,
  FolderKanban,
  KeyRound
} from 'lucide-react';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { PageTransition } from '../components/ui/PageTransition';
import { ClerkOrgProfileWidget } from '../components/ui/ClerkOrgBoundary';
import { useWorkspace } from '../context/WorkspaceContext';
import type { AccessRole, ProjectAccessGrant } from '../types/project';
import {
  getSandboxState,
  grantSandboxProjectAccess,
  revokeSandboxProjectAccess,
  addSandboxOrganization,
  deleteSandboxOrganization,
  assignSandboxProjectsToOrg
} from '../utils/localDemoStore';
import './Dashboard.css';
import './OrganizationDashboard.css';
import './AccessDashboard.css';

export const AccessDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { projects, organizations, isSandboxMode, refreshWorkspace } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'clerk_org' | 'universal' | 'organizations'>('clerk_org');
  const [grants, setGrants] = useState<ProjectAccessGrant[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<ProjectAccessGrant[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [bannerMsg, setBannerMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Universal grant builder state
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [orgShortcutFilter, setOrgShortcutFilter] = useState<string>('all');
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState<AccessRole>('editor');
  const [granting, setGranting] = useState(false);
  const [grantSearch, setGrantSearch] = useState('');

  // Client Organization builder state
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDesc, setNewOrgDesc] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [orgMemberEmail, setOrgMemberEmail] = useState('');
  const [orgMemberRole, setOrgMemberRole] = useState<AccessRole>('editor');
  const [addingOrgMember, setAddingOrgMember] = useState(false);
  const [assignProjectIds, setAssignProjectIds] = useState<string[]>([]);
  const [assigningOrg, setAssigningOrg] = useState(false);

  const loadAccessData = useCallback(async () => {
    setLoadingAccess(true);
    if (isSandboxMode) {
      const s = getSandboxState();
      setGrants(s.projectAccess || []);
      setSharedWithMe([]);
      setLoadingAccess(false);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        setLoadingAccess(false);
        return;
      }
      const res = await fetch('/api/access', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setGrants(Array.isArray(data.grants) ? data.grants : []);
        setSharedWithMe(Array.isArray(data.sharedWithMe) ? data.sharedWithMe : []);
      }
    } catch (_) {
    } finally {
      setLoadingAccess(false);
    }
  }, [getToken, isSandboxMode]);

  useEffect(() => {
    loadAccessData();
  }, [loadAccessData]);

  useEffect(() => {
    if (!selectedOrgId && organizations.length > 0) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  const pickerProjects = projects.filter((p) => {
    if (orgShortcutFilter === 'all') return true;
    if (orgShortcutFilter === 'personal') return !p.organization_id;
    return p.organization_id === orgShortcutFilter;
  });

  const toggleProjectSelection = (pid: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const selectAllVisibleProjects = () => {
    const visibleIds = pickerProjects.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProjectIds.includes(id));
    if (allSelected) {
      setSelectedProjectIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedProjectIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setBannerMsg('');

    const emails = Array.from(
      new Set(
        inviteEmails
          .split(/[,;\s\n]+/)
          .map((em) => em.toLowerCase().trim())
          .filter((em) => em.includes('@'))
      )
    );

    if (selectedProjectIds.length === 0) {
      setErrorMsg('Please select at least one website/project to grant access to.');
      return;
    }
    if (emails.length === 0) {
      setErrorMsg('Please enter at least one valid email address.');
      return;
    }

    setGranting(true);
    try {
      if (isSandboxMode) {
        grantSandboxProjectAccess(selectedProjectIds, emails, inviteRole);
        await refreshWorkspace();
        await loadAccessData();
        setInviteEmails('');
        setSelectedProjectIds([]);
        setBannerMsg(`Granted ${inviteRole.toUpperCase()} access across ${selectedProjectIds.length} project(s).`);
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
          projectIds: selectedProjectIds,
          emails,
          role: inviteRole,
          sendEmail: true
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to grant access');
      }
      setInviteEmails('');
      setSelectedProjectIds([]);
      setBannerMsg(
        `Access granted (${data.grantedCount} rule(s)) and invitation sent to ${emails.join(', ')}.`
      );
      await Promise.all([loadAccessData(), refreshWorkspace()]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to grant access');
    } finally {
      setGranting(false);
    }
  };

  const handleUpdateGrantRole = async (grantId: string, nextRole: AccessRole) => {
    setErrorMsg('');
    if (isSandboxMode) {
      const target = grants.find((g) => g.id === grantId);
      if (target) {
        grantSandboxProjectAccess([target.project_id], [target.granted_to_email], nextRole);
        await loadAccessData();
      }
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch('/api/access', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: grantId, role: nextRole })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update role');
      }
      await loadAccessData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update role');
    }
  };

  const handleRevokeGrant = async (grantId: string) => {
    setErrorMsg('');
    if (isSandboxMode) {
      revokeSandboxProjectAccess(grantId);
      await Promise.all([loadAccessData(), refreshWorkspace()]);
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`/api/access?id=${encodeURIComponent(grantId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to revoke access');
      }
      await Promise.all([loadAccessData(), refreshWorkspace()]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to revoke access');
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreatingOrg(true);
    setErrorMsg('');
    setBannerMsg('');
    try {
      if (isSandboxMode) {
        const created = addSandboxOrganization({ name: newOrgName.trim(), description: newOrgDesc.trim() });
        setNewOrgName('');
        setNewOrgDesc('');
        setSelectedOrgId(created.id);
        await refreshWorkspace();
        setBannerMsg(`Created organization "${created.name}".`);
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
      if (data.organization?.id) setSelectedOrgId(data.organization.id);
      await refreshWorkspace();
      setBannerMsg(`Organization "${data.organization?.name}" created.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create organization');
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    if (!confirm(`Delete organization "${orgName}"? All websites inside it will move safely back to your Personal workspace.`)) {
      return;
    }
    setErrorMsg('');
    try {
      if (isSandboxMode) {
        deleteSandboxOrganization(orgId);
        if (selectedOrgId === orgId) setSelectedOrgId('');
        await refreshWorkspace();
        return;
      }
      const token = await getToken();
      const res = await fetch(`/api/organizations?id=${encodeURIComponent(orgId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to delete organization');
      if (selectedOrgId === orgId) setSelectedOrgId('');
      await refreshWorkspace();
      setBannerMsg(`Deleted organization "${orgName}". Projects were moved to Personal.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to delete organization');
    }
  };

  const handleAddOrgMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !orgMemberEmail.trim()) return;
    setAddingOrgMember(true);
    setErrorMsg('');
    try {
      const token = await getToken();
      const res = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'add_member',
          id: selectedOrgId,
          email: orgMemberEmail.trim(),
          role: orgMemberRole
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add member');
      setOrgMemberEmail('');
      await refreshWorkspace();
      setBannerMsg(`Added ${orgMemberEmail.trim()} to organization.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to add member');
    } finally {
      setAddingOrgMember(false);
    }
  };

  const handleRemoveOrgMember = async (orgId: string, memberId: string) => {
    try {
      const token = await getToken();
      await fetch('/api/organizations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'remove_member',
          id: orgId,
          memberId
        })
      });
      await refreshWorkspace();
    } catch (_) {}
  };

  const handleBulkAssignToSelectedOrg = async () => {
    if (!selectedOrgId || assignProjectIds.length === 0) return;
    setAssigningOrg(true);
    setErrorMsg('');
    try {
      if (isSandboxMode) {
        assignSandboxProjectsToOrg(assignProjectIds, selectedOrgId);
        setAssignProjectIds([]);
        await refreshWorkspace();
        setBannerMsg('Projects assigned to organization.');
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
          projectIds: assignProjectIds,
          organizationId: selectedOrgId
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to assign projects');
      setAssignProjectIds([]);
      await refreshWorkspace();
      setBannerMsg(`Assigned ${data.updatedCount || assignProjectIds.length} website(s) to organization.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to assign projects');
    } finally {
      setAssigningOrg(false);
    }
  };

  const filteredGrants = grants.filter((g) => {
    const q = grantSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (g.granted_to_email || '').toLowerCase().includes(q) ||
      (g.project_name || '').toLowerCase().includes(q) ||
      (g.organization_name || '').toLowerCase().includes(q)
    );
  });

  const activeOrg = organizations.find((o) => o.id === selectedOrgId);
  const unassignedOrOtherProjects = projects.filter((p) => p.organization_id !== selectedOrgId);

  return (
    <PageTransition locationKey="access-hub">
      <BackgroundMesh />
      <div className="dashboard-container">
        <div
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
              <ShieldCheck size={13} />
              MULTI-TENANT ACCESS CONTROL
            </div>
            <h1 className="dashboard-title">Organization &amp; Universal Access</h1>
            <p className="dashboard-subtitle">
              Group 50+ client websites under Organizations, invite team members across entire portfolios, or grant universal per-project access to anyone by email.
            </p>
          </div>

          <Link to="/organization" className="org-btn-secondary" style={{ textDecoration: 'none' }}>
            &larr; Back to Organization Dashboard
          </Link>
        </div>

        {bannerMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1.1rem',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6EE7B7',
              marginBottom: '1.25rem',
              fontSize: '0.88rem'
            }}
          >
            <CheckCircle2 size={17} />
            <span>{bannerMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1.1rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              marginBottom: '1.25rem',
              fontSize: '0.88rem'
            }}
          >
            <AlertTriangle size={17} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="access-tabs">
          <button
            type="button"
            className={`access-tab-btn ${activeTab === 'clerk_org' ? 'active' : ''}`}
            onClick={() => setActiveTab('clerk_org')}
          >
            <Users size={16} /> Clerk Organization
          </button>
          <button
            type="button"
            className={`access-tab-btn ${activeTab === 'universal' ? 'active' : ''}`}
            onClick={() => setActiveTab('universal')}
          >
            <KeyRound size={16} /> Universal Project Access ({grants.length})
          </button>
          <button
            type="button"
            className={`access-tab-btn ${activeTab === 'organizations' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizations')}
          >
            <Building2 size={16} /> Client Organizations ({organizations.length})
          </button>
        </div>

        {/* TAB 0: CLERK ORGANIZATION */}
        {activeTab === 'clerk_org' && (
          <div className="access-panel">
            <ClerkOrgProfileWidget isSandboxMode={isSandboxMode} />
          </div>
        )}

        {/* TAB 1: UNIVERSAL PROJECT ACCESS */}
        {activeTab === 'universal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div className="access-grid-2col">
              {/* Left: Grant Access Form */}
              <form onSubmit={handleGrantAccess} className="access-panel">
                <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={18} color="#00F0FF" /> Grant Access to Anyone
                </h2>
                <p style={{ margin: '0 0 1.1rem', fontSize: '0.82rem', color: '#9CA3AF' }}>
                  Select 1 or all 50+ websites and invite any collaborator email (they can sign in with any GTMObserver account).
                </p>

                <div className="org-modal-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', gap: '0.5rem' }}>
                    <label className="org-modal-label" style={{ margin: 0 }}>
                      1. Select Websites ({selectedProjectIds.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={selectAllVisibleProjects}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#00F0FF',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Toggle All Visible
                    </button>
                  </div>

                  {organizations.length > 0 && (
                    <select
                      value={orgShortcutFilter}
                      onChange={(e) => setOrgShortcutFilter(e.target.value)}
                      className="module-input"
                      style={{ width: '100%', marginBottom: '0.5rem', fontSize: '0.8rem' }}
                    >
                      <option value="all">Filter list: All Organizations ({projects.length})</option>
                      <option value="personal">Personal Workspace Only</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          Org: {org.name} ({org.projectCount || 0})
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="access-project-picker">
                    {pickerProjects.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#6B7280', fontSize: '0.82rem' }}>
                        No active projects found in this filter.
                      </div>
                    ) : (
                      pickerProjects.map((proj) => {
                        const checked = selectedProjectIds.includes(proj.id);
                        return (
                          <label
                            key={proj.id}
                            className={`access-project-option ${checked ? 'selected' : ''}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleProjectSelection(proj.id)}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ color: '#FFFFFF', fontSize: '0.83rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {proj.name}
                                </div>
                                <div style={{ color: '#9CA3AF', fontSize: '0.72rem' }}>
                                  {proj.organization_name || 'Personal'} • {proj.gtm_container_public_id || 'No GTM'}
                                </div>
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="org-modal-field">
                  <label className="org-modal-label">2. Collaborator Email(s)</label>
                  <textarea
                    rows={2}
                    required
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    className="module-input"
                    style={{ width: '100%', resize: 'vertical' }}
                    placeholder="client@hotel.com, teammate@agency.com"
                  />
                </div>

                <div className="org-modal-field">
                  <label className="org-modal-label">3. Permission Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as AccessRole)}
                    className="module-input"
                    style={{ width: '100%' }}
                  >
                    <option value="admin">Admin — Manage project, monitors, deploys &amp; team</option>
                    <option value="editor">Editor — Run audits, deploy GTM tags &amp; manage monitors</option>
                    <option value="viewer">Viewer — Read-only audits, reports &amp; PDF exports</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={granting}
                  className="org-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {granting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Granting Access...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} /> Grant Universal Access
                    </>
                  )}
                </button>
              </form>

              {/* Right: Active Grants Table */}
              <div className="access-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.2rem', fontSize: '1.1rem', color: '#FFFFFF' }}>
                      Active Project Access Grants
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#9CA3AF' }}>
                      People granted direct access across any project in your workspace.
                    </p>
                  </div>

                  <div style={{ position: 'relative', minWidth: '220px' }}>
                    <Search size={14} color="#6B7280" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="search"
                      value={grantSearch}
                      onChange={(e) => setGrantSearch(e.target.value)}
                      placeholder="Filter email or project..."
                      className="module-input"
                      style={{ paddingLeft: '2rem', fontSize: '0.82rem', width: '100%' }}
                    />
                  </div>
                </div>

                {loadingAccess ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                    Loading permissions...
                  </div>
                ) : filteredGrants.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>
                    No direct project grants yet. Select websites on the left to share access with teammates or clients.
                  </div>
                ) : (
                  <div className="access-table-wrap">
                    <table className="access-table">
                      <thead>
                        <tr>
                          <th>Collaborator</th>
                          <th>Website / Project</th>
                          <th>Role</th>
                          <th style={{ textAlign: 'right' }}>Revoke</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGrants.map((g) => (
                          <tr key={g.id}>
                            <td>
                              <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{g.granted_to_email}</div>
                              <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                                {g.granted_to_user_id ? 'Account linked' : 'Pending first sign-in'}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#00F0FF' }}>{g.project_name || g.project_id}</div>
                              <div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                                {g.organization_name || 'Personal'}
                              </div>
                            </td>
                            <td>
                              <select
                                value={g.role}
                                onChange={(e) => handleUpdateGrantRole(g.id, e.target.value as AccessRole)}
                                className="access-role-select"
                              >
                                <option value="admin">Admin</option>
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => handleRevokeGrant(g.id)}
                                className="org-action-btn delete-btn"
                                title="Revoke access"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Shared With Me */}
            {sharedWithMe.length > 0 && (
              <div className="access-panel">
                <h2 style={{ margin: '0 0 0.85rem', fontSize: '1.08rem', color: '#FFFFFF' }}>
                  Projects Shared With You ({user?.primaryEmailAddress?.emailAddress})
                </h2>
                <div className="access-table-wrap">
                  <table className="access-table">
                    <thead>
                      <tr>
                        <th>Website / Project</th>
                        <th>Organization</th>
                        <th>Your Role</th>
                        <th>Granted By</th>
                        <th style={{ textAlign: 'right' }}>Open</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sharedWithMe.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 700, color: '#FFFFFF' }}>{s.project_name}</td>
                          <td style={{ color: '#9CA3AF' }}>{s.organization_name || 'Shared'}</td>
                          <td>
                            <span
                              className="access-role-pill"
                              style={{
                                background: 'rgba(0, 240, 255, 0.12)',
                                color: '#00F0FF',
                                border: '1px solid rgba(0, 240, 255, 0.3)'
                              }}
                            >
                              {s.role}
                            </span>
                          </td>
                          <td style={{ color: '#9CA3AF' }}>{s.granted_by_email || 'Owner'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <Link
                              to={`/projects/${s.project_id}/dashboard`}
                              className="org-btn-secondary"
                              style={{ textDecoration: 'none' }}
                            >
                              Open <ArrowRight size={13} />
                            </Link>
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

        {/* TAB 2: CLIENT ORGANIZATIONS */}
        {activeTab === 'organizations' && (
          <div className="access-grid-2col">
            {/* Left: Create + List Client Orgs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <form onSubmit={handleCreateOrg} className="access-panel">
                <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.08rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={18} color="#00F0FF" /> Create Client Organization
                </h2>
                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#9CA3AF' }}>
                  Group 50+ websites for a management company into one Organization container.
                </p>

                <div className="org-modal-field">
                  <label className="org-modal-label">Organization / Company Name</label>
                  <input
                    type="text"
                    required
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="e.g. Cogwheel Hospitality (50 Hotels)"
                    className="module-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="org-modal-field">
                  <label className="org-modal-label">Notes / Portfolio Description (Optional)</label>
                  <input
                    type="text"
                    value={newOrgDesc}
                    onChange={(e) => setNewOrgDesc(e.target.value)}
                    placeholder="50 managed properties across North America"
                    className="module-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingOrg}
                  className="org-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {creatingOrg ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Create Organization
                </button>
              </form>

              <div className="access-panel">
                <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.96rem', color: '#FFFFFF' }}>
                  Your Organizations ({organizations.length})
                </h3>
                {organizations.length === 0 ? (
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '0.83rem' }}>
                    No organizations created yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {organizations.map((org) => {
                      const active = org.id === selectedOrgId;
                      return (
                        <div
                          key={org.id}
                          onClick={() => setSelectedOrgId(org.id)}
                          style={{
                            padding: '0.8rem 0.95rem',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            border: active
                              ? '1px solid rgba(0, 240, 255, 0.45)'
                              : '1px solid rgba(255, 255, 255, 0.08)',
                            background: active ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.6rem'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.92rem' }}>
                              {org.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.2rem' }}>
                              {org.projectCount || 0} websites • {org.memberCount || 0} members • Role: {org.role || 'owner'}
                            </div>
                          </div>
                          {org.role === 'owner' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOrg(org.id, org.name);
                              }}
                              className="org-action-btn delete-btn"
                              title="Delete organization"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Selected Organization Members + Bulk Assign */}
            <div className="access-panel">
              {!activeOrg ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9CA3AF' }}>
                  Select or create an Organization on the left to manage its team members and assign websites.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.25rem', color: '#FFFFFF', fontSize: '1.2rem' }}>
                      {activeOrg.name}
                    </h2>
                    <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.84rem' }}>
                      {activeOrg.description || 'Every team member added below automatically receives access to all websites inside this organization.'}
                    </p>
                  </div>

                  {/* Add Org Member */}
                  <form
                    onSubmit={handleAddOrgMember}
                    style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}
                  >
                    <input
                      type="email"
                      required
                      value={orgMemberEmail}
                      onChange={(e) => setOrgMemberEmail(e.target.value)}
                      placeholder="Add team member email..."
                      className="module-input"
                      style={{ flex: '1 1 220px' }}
                    />
                    <select
                      value={orgMemberRole}
                      onChange={(e) => setOrgMemberRole(e.target.value as AccessRole)}
                      className="module-input"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button type="submit" disabled={addingOrgMember} className="org-btn-primary">
                      {addingOrgMember ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                      Add Member
                    </button>
                  </form>

                  {/* Org Members Table */}
                  <div className="access-table-wrap">
                    <table className="access-table">
                      <thead>
                        <tr>
                          <th>Member Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeOrg.members || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', color: '#6B7280' }}>
                              No team members added yet.
                            </td>
                          </tr>
                        ) : (
                          (activeOrg.members || []).map((m) => (
                            <tr key={m.id}>
                              <td style={{ fontWeight: 600 }}>{m.email}</td>
                              <td>
                                <span
                                  className="access-role-pill"
                                  style={{
                                    background: 'rgba(168, 85, 247, 0.12)',
                                    color: '#D8B4FE',
                                    border: '1px solid rgba(168, 85, 247, 0.25)'
                                  }}
                                >
                                  {m.role}
                                </span>
                              </td>
                              <td style={{ color: '#9CA3AF' }}>{m.status}</td>
                              <td style={{ textAlign: 'right' }}>
                                {m.role !== 'owner' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOrgMember(activeOrg.id, m.id)}
                                    className="org-action-btn delete-btn"
                                    title="Remove member"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Assign Projects to this Org */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '0.96rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <FolderKanban size={16} color="#00F0FF" /> Assign Websites to {activeOrg.name}
                      </h3>
                      <button
                        type="button"
                        disabled={assignProjectIds.length === 0 || assigningOrg}
                        onClick={handleBulkAssignToSelectedOrg}
                        className="org-btn-primary"
                      >
                        {assigningOrg ? <Loader2 size={14} className="animate-spin" /> : null}
                        Assign Selected ({assignProjectIds.length})
                      </button>
                    </div>

                    {unassignedOrOtherProjects.length === 0 ? (
                      <p style={{ margin: 0, color: '#6B7280', fontSize: '0.82rem' }}>
                        All of your active projects are already assigned to this organization.
                      </p>
                    ) : (
                      <div className="access-project-picker" style={{ maxHeight: '190px' }}>
                        {unassignedOrOtherProjects.map((p) => {
                          const checked = assignProjectIds.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className={`access-project-option ${checked ? 'selected' : ''}`}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    setAssignProjectIds((prev) =>
                                      prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                                    )
                                  }
                                />
                                <span style={{ color: '#FFFFFF', fontSize: '0.83rem', fontWeight: 600 }}>
                                  {p.name}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.74rem', color: '#9CA3AF' }}>
                                Current: {p.organization_name || 'Personal'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
};
