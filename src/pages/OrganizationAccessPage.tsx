import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FolderKanban,
  KeyRound,
  Plus
} from 'lucide-react';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { PageTransition } from '../components/ui/PageTransition';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Organization, AccessRole, ProjectAccessGrant } from '../types/project';
import {
  getSandboxState,
  addSandboxOrgMember,
  updateSandboxOrgMember,
  removeSandboxOrgMember,
  assignSandboxProjectsToOrg,
  grantSandboxProjectAccess,
  revokeSandboxProjectAccess
} from '../utils/localDemoStore';
import './Dashboard.css';
import './OrganizationDashboard.css';
import './AccessDashboard.css';

interface OrganizationAccessPageProps {
  organization: Organization;
}

export const OrganizationAccessPage: React.FC<OrganizationAccessPageProps> = ({ organization }) => {
  const { getToken } = useAuth();
  const { projects, isSandboxMode, refreshWorkspace } = useWorkspace();

  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<AccessRole>('editor');
  const [addingMember, setAddingMember] = useState(false);

  const [selectedAssignIds, setSelectedAssignIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const [orgProjectGrants, setOrgProjectGrants] = useState<ProjectAccessGrant[]>([]);
  const [loadingGrants, setLoadingGrants] = useState(true);
  const [directProjectId, setDirectProjectId] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  const [directRole, setDirectRole] = useState<AccessRole>('viewer');
  const [grantingDirect, setGrantingDirect] = useState(false);

  const [bannerMsg, setBannerMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const orgProjects = useMemo(
    () => projects.filter((p) => p.organization_id === organization.id),
    [projects, organization.id]
  );

  const unassignedProjects = useMemo(
    () => projects.filter((p) => p.organization_id !== organization.id && (p.accessSource || 'owner') === 'owner'),
    [projects, organization.id]
  );

  const orgProjectIdsSet = useMemo(() => new Set(orgProjects.map((p) => p.id)), [orgProjects]);
  const canManage = organization.role === 'owner' || organization.role === 'admin' || !organization.role;

  useEffect(() => {
    if (!directProjectId && orgProjects.length > 0) {
      setDirectProjectId(orgProjects[0].id);
    }
  }, [orgProjects, directProjectId]);

  const loadGrants = useCallback(async () => {
    setLoadingGrants(true);
    if (isSandboxMode) {
      const s = getSandboxState();
      setOrgProjectGrants((s.projectAccess || []).filter((g) => orgProjectIdsSet.has(g.project_id)));
      setLoadingGrants(false);
      return;
    }
    try {
      const token = await getToken();
      if (!token) {
        setLoadingGrants(false);
        return;
      }
      const res = await fetch('/api/access', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.grants)) {
        setOrgProjectGrants(
          data.grants.filter(
            (g: ProjectAccessGrant) =>
              g.organization_id === organization.id || orgProjectIdsSet.has(g.project_id)
          )
        );
      }
    } catch (_) {
    } finally {
      setLoadingGrants(false);
    }
  }, [getToken, isSandboxMode, organization.id, orgProjectIdsSet]);

  useEffect(() => {
    loadGrants();
  }, [loadGrants]);

  const handleAddOrgMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = memberEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid teammate or client email address.');
      return;
    }
    setErrorMsg('');
    setBannerMsg('');
    setAddingMember(true);
    try {
      if (isSandboxMode) {
        addSandboxOrgMember(organization.id, email, memberRole);
        setMemberEmail('');
        await refreshWorkspace();
        setBannerMsg(`Added ${email} (${memberRole.toUpperCase()}) across all websites in ${organization.name}.`);
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
          action: 'add_member',
          id: organization.id,
          email,
          role: memberRole
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add organization member');
      setMemberEmail('');
      await refreshWorkspace();
      setBannerMsg(`Granted ${memberRole.toUpperCase()} organizational access to ${email} and sent invite.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, nextRole: AccessRole) => {
    setErrorMsg('');
    if (isSandboxMode) {
      updateSandboxOrgMember(organization.id, memberId, nextRole);
      await refreshWorkspace();
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'update_member',
          id: organization.id,
          memberId,
          role: nextRole
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      await refreshWorkspace();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setErrorMsg('');
    if (isSandboxMode) {
      removeSandboxOrgMember(organization.id, memberId);
      await refreshWorkspace();
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'remove_member',
          id: organization.id,
          memberId
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to remove member');
      await refreshWorkspace();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove member');
    }
  };

  const handleAssignProjectsIntoOrg = async () => {
    if (selectedAssignIds.length === 0) return;
    setAssigning(true);
    setErrorMsg('');
    setBannerMsg('');
    try {
      if (isSandboxMode) {
        assignSandboxProjectsToOrg(selectedAssignIds, organization.id);
        setSelectedAssignIds([]);
        await refreshWorkspace();
        setBannerMsg(`Assigned ${selectedAssignIds.length} website(s) into ${organization.name}.`);
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
          projectIds: selectedAssignIds,
          organizationId: organization.id
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to assign websites');
      setSelectedAssignIds([]);
      await refreshWorkspace();
      setBannerMsg(`Assigned ${data.updatedCount || selectedAssignIds.length} website(s) into ${organization.name}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to assign websites');
    } finally {
      setAssigning(false);
    }
  };

  const handleGrantDirectSiteAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = directEmail.trim().toLowerCase();
    if (!directProjectId || !email || !email.includes('@')) {
      setErrorMsg('Select a website inside this organization and enter a valid email.');
      return;
    }
    setGrantingDirect(true);
    setErrorMsg('');
    setBannerMsg('');
    try {
      if (isSandboxMode) {
        grantSandboxProjectAccess([directProjectId], [email], directRole);
        setDirectEmail('');
        await Promise.all([loadGrants(), refreshWorkspace()]);
        setBannerMsg(`Granted ${directRole.toUpperCase()} access to ${email}.`);
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
          projectIds: [directProjectId],
          emails: [email],
          role: directRole,
          sendEmail: true
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to grant single-site access');
      setDirectEmail('');
      await Promise.all([loadGrants(), refreshWorkspace()]);
      setBannerMsg(`Granted single-website ${directRole.toUpperCase()} access to ${email}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to grant single-site access');
    } finally {
      setGrantingDirect(false);
    }
  };

  const handleRevokeDirectGrant = async (grantId: string) => {
    setErrorMsg('');
    if (isSandboxMode) {
      revokeSandboxProjectAccess(grantId);
      await Promise.all([loadGrants(), refreshWorkspace()]);
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
      await Promise.all([loadGrants(), refreshWorkspace()]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to revoke access');
    }
  };

  const members = organization.members || [];

  return (
    <PageTransition locationKey={`org-access-${organization.id}`}>
      <BackgroundMesh />
      <div className="dashboard-container">
        <div style={{ marginBottom: '1rem' }}>
          <Link
            to={`/organizations/${encodeURIComponent(organization.id)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#00F0FF',
              textDecoration: 'none',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={15} /> Back to {organization.name} Dashboard
          </Link>
        </div>

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
              ORGANIZATIONAL ACCESS • {organization.name.toUpperCase()}
            </div>
            <h1 className="dashboard-title">Organizational Access &amp; Team Roles</h1>
            <p className="dashboard-subtitle">
              Manage organization-wide members across all {orgProjects.length} website(s) in{' '}
              <strong>{organization.name}</strong>, assign websites, or grant single-site contractor overrides.
            </p>
          </div>

          <Link
            to={`/onboarding?orgId=${encodeURIComponent(organization.id)}`}
            className="btn-deploy-bulk"
            style={{ marginTop: 0, textDecoration: 'none' }}
          >
            <Plus size={16} style={{ marginRight: '0.4rem' }} />
            New Project in {organization.name}
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
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#6EE7B7',
              fontSize: '0.86rem',
              marginBottom: '1.25rem'
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
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#FCA5A5',
              fontSize: '0.86rem',
              marginBottom: '1.25rem'
            }}
          >
            <AlertTriangle size={17} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Organization-Wide Team Members */}
        <div className="access-grid-2col" style={{ marginBottom: '1.75rem' }}>
          <div className="access-panel">
            <h3 style={{ margin: '0 0 0.35rem', color: '#FFFFFF', fontSize: '1.08rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} color="#00F0FF" /> Add Organization Member
            </h3>
            <p style={{ margin: '0 0 1.15rem', color: '#9CA3AF', fontSize: '0.82rem', lineHeight: 1.5 }}>
              Organization members automatically inherit access to every current and future website inside{' '}
              <strong>{organization.name}</strong>.
            </p>

            <form onSubmit={handleAddOrgMember}>
              <div className="org-modal-field">
                <label className="org-modal-label">Member / Client Email</label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="partner@cogwheelmarketing.com"
                  className="module-input"
                  style={{ width: '100%' }}
                  disabled={!canManage}
                />
              </div>

              <div className="org-modal-field">
                <label className="org-modal-label">Organization Role</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as AccessRole)}
                  className="module-input"
                  style={{ width: '100%' }}
                  disabled={!canManage}
                >
                  <option value="admin">Admin — Manage all org sites, team &amp; trash</option>
                  <option value="editor">Editor — Deploy GTM recipes, audits &amp; GA4 monitors</option>
                  <option value="viewer">Viewer — Read-only reports &amp; PDF downloads</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={addingMember || !canManage}
                className="org-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {addingMember ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
                Add to {organization.name}
              </button>
            </form>
          </div>

          <div className="access-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '1.08rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={18} color="#00F0FF" /> Organization Members ({members.length})
                </h3>
                <p style={{ margin: '0.2rem 0 0', color: '#9CA3AF', fontSize: '0.8rem' }}>
                  Applies uniformly across all {orgProjects.length} website(s) in this organization.
                </p>
              </div>
            </div>

            {members.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>
                No team members added yet. Invite an Admin, Editor, or Viewer on the left.
              </div>
            ) : (
              <div className="access-table-wrap">
                <table className="access-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600, color: '#FFFFFF' }}>{m.email}</td>
                        <td>
                          {m.role === 'owner' || !canManage ? (
                            <span
                              className="access-role-pill"
                              style={{ background: 'rgba(0, 240, 255, 0.14)', color: '#00F0FF' }}
                            >
                              {String(m.role).toUpperCase()}
                            </span>
                          ) : (
                            <select
                              value={m.role}
                              onChange={(e) => handleUpdateMemberRole(m.id, e.target.value as AccessRole)}
                              className="access-role-select"
                            >
                              <option value="admin">Admin</option>
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.76rem', color: m.status === 'active' ? '#6EE7B7' : '#FCD34D' }}>
                            {m.status === 'active' ? 'Active' : 'Invited'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {m.role !== 'owner' && canManage && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.id)}
                              className="org-action-btn delete-btn"
                              title="Remove from organization"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Assign Websites + Single-Website Overrides */}
        <div className="access-grid-2col" style={{ marginBottom: '1.75rem' }}>
          <div className="access-panel">
            <h3 style={{ margin: '0 0 0.35rem', color: '#FFFFFF', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderKanban size={17} color="#00F0FF" /> Add Existing Websites Into Org
            </h3>
            <p style={{ margin: '0 0 1rem', color: '#9CA3AF', fontSize: '0.82rem' }}>
              Bulk-move owned websites into <strong>{organization.name}</strong> so all members above get instant access.
            </p>

            {unassignedProjects.length === 0 ? (
              <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                All of your owned websites are already inside {organization.name}, or create a new one with <strong>+ New Project</strong>.
              </div>
            ) : (
              <>
                <div className="access-project-picker" style={{ marginBottom: '0.9rem' }}>
                  {unassignedProjects.map((p) => {
                    const checked = selectedAssignIds.includes(p.id);
                    return (
                      <label key={p.id} className={`access-project-option ${checked ? 'selected' : ''}`}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setSelectedAssignIds((prev) =>
                                prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                              )
                            }
                          />
                          <span style={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.83rem' }}>{p.name}</span>
                        </span>
                        <span style={{ color: '#9CA3AF', fontSize: '0.73rem' }}>
                          {p.organization_name || 'Personal'}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={assigning || selectedAssignIds.length === 0 || !canManage}
                  onClick={handleAssignProjectsIntoOrg}
                  className="org-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {assigning ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Move {selectedAssignIds.length || ''} Selected Website(s) to {organization.name}
                </button>
              </>
            )}
          </div>

          <div className="access-panel">
            <h3 style={{ margin: '0 0 0.35rem', color: '#FFFFFF', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <KeyRound size={17} color="#00F0FF" /> Per-Website Access Overrides ({orgProjectGrants.length})
            </h3>
            <p style={{ margin: '0 0 1rem', color: '#9CA3AF', fontSize: '0.82rem' }}>
              Grant a contractor or client access to one specific website inside {organization.name} without exposing the entire portfolio.
            </p>

            {orgProjects.length > 0 && (
              <form
                onSubmit={handleGrantDirectSiteAccess}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.5rem', marginBottom: '1rem' }}
              >
                <select
                  value={directProjectId}
                  onChange={(e) => setDirectProjectId(e.target.value)}
                  className="module-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                >
                  {orgProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="email"
                  required
                  value={directEmail}
                  onChange={(e) => setDirectEmail(e.target.value)}
                  placeholder="contractor@email.com"
                  className="module-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                />
                <select
                  value={directRole}
                  onChange={(e) => setDirectRole(e.target.value as AccessRole)}
                  className="module-input"
                  style={{ width: 'auto', fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" disabled={grantingDirect} className="org-btn-primary">
                  {grantingDirect ? <Loader2 size={14} className="animate-spin" /> : 'Grant'}
                </button>
              </form>
            )}

            {loadingGrants ? (
              <div style={{ color: '#9CA3AF', fontSize: '0.82rem' }}>Loading direct grants...</div>
            ) : orgProjectGrants.length === 0 ? (
              <div style={{ color: '#6B7280', fontSize: '0.82rem' }}>
                No per-website overrides active in this organization.
              </div>
            ) : (
              <div className="access-table-wrap">
                <table className="access-table">
                  <thead>
                    <tr>
                      <th>Website</th>
                      <th>User</th>
                      <th>Role</th>
                      <th style={{ textAlign: 'right' }}>Revoke</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orgProjectGrants.map((g) => (
                      <tr key={g.id}>
                        <td style={{ fontWeight: 600, color: '#FFFFFF' }}>{g.project_name || g.project_id}</td>
                        <td>{g.granted_to_email}</td>
                        <td>
                          <span
                            className="access-role-pill"
                            style={{ background: 'rgba(168, 85, 247, 0.14)', color: '#D8B4FE' }}
                          >
                            {g.role}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleRevokeDirectGrant(g.id)}
                            className="org-action-btn delete-btn"
                            title="Revoke single-site access"
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
      </div>
    </PageTransition>
  );
};
