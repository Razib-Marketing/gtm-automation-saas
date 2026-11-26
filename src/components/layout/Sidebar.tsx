import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Settings,
  HelpCircle,
  Activity,
  ArrowLeft,
  PlusCircle,
  CreditCard,
  Code2,
  Sliders,
  Layers,
  Menu,
  X,
  ShieldCheck,
  Trash2,
  Building2,
  ChevronDown,
  Users,
  Plus
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ClerkOrgSwitcherWidget } from '../ui/ClerkOrgBoundary';
import { getWebsiteTypeMeta } from '../../types/project';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    userTier,
    hasActiveSubscription,
    hasSharedAccess,
    organizations,
    projects,
    trashedProjects,
    isSandboxMode,
    getProjectById,
    getOrganizationById
  } = useWorkspace();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  );

  const openBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const projectMatch = location.pathname.match(/^\/projects\/([^/]+)/);
  const activeProjectId = projectMatch ? decodeURIComponent(projectMatch[1]) : null;
  const activeProject = activeProjectId ? getProjectById(activeProjectId) : undefined;
  const isProjectMode = Boolean(activeProjectId);

  const orgMatch = !isProjectMode ? location.pathname.match(/^\/organizations\/([^/]+)/) : null;
  const activeScopedOrgId = orgMatch ? decodeURIComponent(orgMatch[1]) : null;
  const activeScopedOrg = activeScopedOrgId ? getOrganizationById(activeScopedOrgId) : undefined;
  const isOrgScopedMode = Boolean(activeScopedOrgId);

  const typeMeta = activeProject ? getWebsiteTypeMeta(activeProject.website_type) : null;

  const personalCount = projects.filter((p) => !p.organization_id && (p.accessSource || 'owner') === 'owner').length;
  const sharedCount = projects.filter((p) => p.accessSource && p.accessSource !== 'owner').length;
  const scopedOrgTrashedCount = activeScopedOrgId
    ? trashedProjects.filter((p) => p.organization_id === activeScopedOrgId).length
    : 0;
  const scopedOrgActiveCount = activeScopedOrgId
    ? projects.filter((p) => p.organization_id === activeScopedOrgId).length
    : 0;

  const currentSearch = new URLSearchParams(location.search);
  const currentOrgScopeParam = currentSearch.get('scope');
  const currentOrgTabParam = currentSearch.get('tab');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 1023px)');
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobileViewport(e.matches);
      if (!e.matches) {
        setDrawerOpen(false);
      }
    };
    setIsMobileViewport(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const mainEl = document.getElementById('main-content') as (HTMLElement & { inert?: boolean }) | null;
    if (drawerOpen && isMobileViewport) {
      wasOpenRef.current = true;
      if (mainEl) mainEl.inert = true;
      requestAnimationFrame(() => closeBtnRef.current?.focus());

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setDrawerOpen(false);
        }
      };
      document.addEventListener('keydown', onKeyDown);
      return () => {
        if (mainEl) mainEl.inert = false;
        document.removeEventListener('keydown', onKeyDown);
      };
    } else {
      if (mainEl) mainEl.inert = false;
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        openBtnRef.current?.focus();
      }
    }
  }, [drawerOpen, isMobileViewport]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      {/* Sticky Top Header shown below 1024px */}
      <header className="mobile-app-topbar">
        <button
          ref={openBtnRef}
          type="button"
          className="mobile-drawer-toggle"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          aria-controls="app-sidebar-drawer"
        >
          <Menu size={22} aria-hidden="true" />
        </button>

        <div className="mobile-app-topbar-center">
          <img src="/gtmobserver-icon.webp" alt="" aria-hidden="true" style={{ width: '24px', height: '24px', flexShrink: 0 }} />
          <div className="mobile-app-context-text">
            <span className="mobile-app-context-title">
              {isProjectMode
                ? activeProject?.name || 'Project Workspace'
                : isOrgScopedMode
                ? activeScopedOrg?.name || 'Organization Workspace'
                : 'Organization'}
            </span>
            <span className="mobile-app-context-sub">
              {isProjectMode
                ? 'PROJECT'
                : isOrgScopedMode
                ? 'CLIENT ORG'
                : `${userTier.toUpperCase()} PLAN`}
            </span>
          </div>
        </div>

        <div className="mobile-app-topbar-right">
          {isProjectMode ? (
            <Link
              to={activeProject?.organization_id ? `/organizations/${encodeURIComponent(activeProject.organization_id)}` : '/organization'}
              className="mobile-topbar-quick-btn"
              title="Back"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Org</span>
            </Link>
          ) : isOrgScopedMode ? (
            <Link
              to={`/onboarding?orgId=${encodeURIComponent(activeScopedOrgId || '')}`}
              className="mobile-topbar-quick-btn accent"
              title="New Project in Organization"
            >
              <PlusCircle size={16} aria-hidden="true" />
              <span>Add</span>
            </Link>
          ) : (
            <Link to="/onboarding" className="mobile-topbar-quick-btn accent" title="New Project">
              <PlusCircle size={16} aria-hidden="true" />
              <span>New</span>
            </Link>
          )}
        </div>
      </header>

      {drawerOpen && isMobileViewport && (
        <div
          className="sidebar-backdrop"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar-drawer"
        className={`global-sidebar ${drawerOpen ? 'open' : ''}`}
        role={isMobileViewport && drawerOpen ? 'dialog' : undefined}
        aria-modal={isMobileViewport && drawerOpen ? true : undefined}
        aria-label="Workspace navigation"
      >
        <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.65rem' }}>
          <div className="sidebar-brand-row">
            <a
              href={isSandboxMode ? '/' : 'https://gtmobserver.com'}
              title="Back to GTMObserver Home"
              style={{ display: 'inline-block' }}
            >
              <img src="/gtmobserver-logo.webp" alt="GTMObserver Logo" style={{ height: '34px', width: 'auto' }} />
            </a>

            <button
              ref={closeBtnRef}
              type="button"
              className="sidebar-close-btn"
              onClick={closeDrawer}
              aria-label="Close navigation menu"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {isProjectMode ? (
            <div className="sidebar-project-context">
              <Link
                to={
                  activeProject?.organization_id
                    ? `/organizations/${encodeURIComponent(activeProject.organization_id)}`
                    : '/organization'
                }
                onClick={closeDrawer}
                className="sidebar-back-org"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                <span>
                  {activeProject?.organization_name
                    ? `Back to ${activeProject.organization_name}`
                    : 'All Projects (Organization)'}
                </span>
              </Link>
              <div className="sidebar-active-project-card">
                <div className="sidebar-active-project-top">
                  <span className="sidebar-scope-label">PROJECT WORKSPACE</span>
                  {typeMeta && (
                    <span
                      className="sidebar-type-dot"
                      style={{
                        color: typeMeta.color,
                        borderColor: `${typeMeta.color}44`,
                        background: `${typeMeta.color}18`
                      }}
                    >
                      {typeMeta.badge}
                    </span>
                  )}
                </div>
                <div className="sidebar-active-project-name" title={activeProject?.name || activeProjectId || ''}>
                  {activeProject?.name || 'Project Workspace'}
                </div>
                {activeProject && (
                  <div className="sidebar-active-project-bindings">
                    <span>{activeProject.gtm_container_public_id || 'GTM Unlinked'}</span>
                    <span>•</span>
                    <span>
                      {activeProject.ga4_property_id
                        ? activeProject.ga4_property_id.replace('properties/', 'GA4: ')
                        : 'GA4 Unlinked'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : isOrgScopedMode ? (
            <div className="sidebar-project-context">
              <Link to="/organization" onClick={closeDrawer} className="sidebar-back-org">
                <ArrowLeft size={14} aria-hidden="true" />
                <span>All Organizations</span>
              </Link>
              <div className="sidebar-active-project-card">
                <div className="sidebar-active-project-top">
                  <span className="sidebar-scope-label">CLIENT ORGANIZATION</span>
                  <span
                    className="sidebar-type-dot"
                    style={{
                      color: '#00F0FF',
                      borderColor: 'rgba(0, 240, 255, 0.35)',
                      background: 'rgba(0, 240, 255, 0.12)'
                    }}
                  >
                    {scopedOrgActiveCount} Sites
                  </span>
                </div>

                {organizations.length > 0 ? (
                  <select
                    aria-label="Switch active organization"
                    value={activeScopedOrgId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__all__') navigate('/organization');
                      else if (val === '__new__') navigate('/organization?createOrg=1');
                      else if (val) navigate(`/organizations/${encodeURIComponent(val)}`);
                    }}
                    className="sidebar-org-select"
                  >
                    {organizations.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.projectCount ?? projects.filter((p) => p.organization_id === o.id).length})
                      </option>
                    ))}
                    <option value="__all__">View All Organizations</option>
                    <option value="__new__">+ New Organization</option>
                  </select>
                ) : (
                  <div className="sidebar-active-project-name">
                    {activeScopedOrg?.name || 'Organization Workspace'}
                  </div>
                )}

                <div className="sidebar-active-project-bindings">
                  <span>{activeScopedOrg?.memberCount ?? activeScopedOrg?.members?.length ?? 1} member(s)</span>
                  <span>•</span>
                  <span style={{ textTransform: 'uppercase' }}>{activeScopedOrg?.role || 'owner'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <ClerkOrgSwitcherWidget compact isSandboxMode={isSandboxMode} />
              <div className="sidebar-scope-pill org">
                <Layers size={12} aria-hidden="true" />
                <span>ORGANIZATION</span>
                <span className={`sidebar-tier-tag ${hasActiveSubscription ? 'paid' : 'free'}`}>
                  {userTier.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {isProjectMode ? (
          <nav className="sidebar-nav" aria-label="Project Workspace Navigation">
            <NavLink
              to={`/projects/${activeProjectId}/dashboard`}
              onClick={closeDrawer}
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={19} aria-hidden="true" />
              <span>Project Overview</span>
            </NavLink>
            <NavLink
              to={`/projects/${activeProjectId}/gtm`}
              onClick={closeDrawer}
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <Code2 size={19} aria-hidden="true" />
              <span>GTM Automation &amp; Audit</span>
            </NavLink>
            <NavLink
              to={`/projects/${activeProjectId}/observer`}
              onClick={closeDrawer}
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <Activity size={19} aria-hidden="true" />
              <span>GA4 Observer &amp; Audit</span>
            </NavLink>
            <NavLink
              to={`/projects/${activeProjectId}/analytics`}
              onClick={closeDrawer}
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <BarChart3 size={19} aria-hidden="true" />
              <span>Project Analytics</span>
            </NavLink>
            <NavLink
              to={`/projects/${activeProjectId}/settings`}
              onClick={closeDrawer}
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <Sliders size={19} aria-hidden="true" />
              <span>Project Settings</span>
            </NavLink>
          </nav>
        ) : isOrgScopedMode ? (
          <nav className="sidebar-nav" aria-label="Client Organization Navigation">
            <NavLink
              to={`/organizations/${encodeURIComponent(activeScopedOrgId || '')}`}
              end
              onClick={closeDrawer}
              className={() =>
                `sidebar-nav-link ${
                  location.pathname === `/organizations/${activeScopedOrgId}` && currentOrgTabParam !== 'trash'
                    ? 'active'
                    : ''
                }`
              }
            >
              <Building2 size={19} aria-hidden="true" />
              <span>Org Dashboard</span>
              <span className="sidebar-count-pill">{scopedOrgActiveCount}</span>
            </NavLink>
            <NavLink
              to={`/organizations/${encodeURIComponent(activeScopedOrgId || '')}/access`}
              onClick={closeDrawer}
              className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            >
              <ShieldCheck size={19} aria-hidden="true" />
              <span>Organizational Access</span>
            </NavLink>
            <NavLink
              to={`/onboarding?orgId=${encodeURIComponent(activeScopedOrgId || '')}`}
              onClick={closeDrawer}
              className="sidebar-nav-link"
            >
              <PlusCircle size={19} aria-hidden="true" />
              <span>Add Website to Org</span>
            </NavLink>
            <Link
              to={`/organizations/${encodeURIComponent(activeScopedOrgId || '')}?tab=trash`}
              onClick={closeDrawer}
              className={`sidebar-nav-link ${currentOrgTabParam === 'trash' ? 'active' : ''}`}
            >
              <Trash2 size={19} aria-hidden="true" />
              <span>Org Trash</span>
              {scopedOrgTrashedCount > 0 && (
                <span className="sidebar-trash-pill">{scopedOrgTrashedCount}</span>
              )}
            </Link>
          </nav>
        ) : (
          <nav className="sidebar-nav" aria-label="Organization Navigation">
            {/* Interactive Organization Dropdown */}
            <div className="sidebar-org-dropdown">
              <div className="sidebar-org-dropdown-header">
                <NavLink
                  to="/organization"
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    `sidebar-nav-link sidebar-org-main-link ${isActive && !currentOrgScopeParam ? 'active' : ''}`
                  }
                >
                  <FolderKanban size={19} aria-hidden="true" />
                  <span>Organization</span>
                </NavLink>
                <button
                  type="button"
                  className={`sidebar-org-chevron-btn ${orgMenuOpen ? 'open' : ''}`}
                  onClick={() => setOrgMenuOpen((prev) => !prev)}
                  aria-expanded={orgMenuOpen}
                  aria-label="Toggle organization workspaces dropdown"
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              </div>

              {orgMenuOpen && (
                <div className="sidebar-org-submenu">
                  <Link
                    to="/organization"
                    onClick={closeDrawer}
                    className={`sidebar-org-subitem ${
                      location.pathname === '/organization' && !currentOrgScopeParam ? 'active' : ''
                    }`}
                  >
                    <Layers size={14} />
                    <span className="sidebar-subitem-label">All Organizations</span>
                    <span className="sidebar-subitem-count">{projects.length}</span>
                  </Link>

                  <Link
                    to="/organization?scope=personal"
                    onClick={closeDrawer}
                    className={`sidebar-org-subitem ${
                      location.pathname === '/organization' && currentOrgScopeParam === 'personal' ? 'active' : ''
                    }`}
                  >
                    <FolderKanban size={14} />
                    <span className="sidebar-subitem-label">Personal Workspace</span>
                    <span className="sidebar-subitem-count">{personalCount}</span>
                  </Link>

                  {organizations.map((org) => {
                    const orgCount = projects.filter((p) => p.organization_id === org.id).length;
                    return (
                      <Link
                        key={org.id}
                        to={`/organizations/${encodeURIComponent(org.id)}`}
                        onClick={closeDrawer}
                        className="sidebar-org-subitem org-client-item"
                        title={`Open ${org.name} dashboard`}
                      >
                        <Building2 size={14} />
                        <span className="sidebar-subitem-label">{org.name}</span>
                        <span className="sidebar-subitem-count">{orgCount}</span>
                      </Link>
                    );
                  })}

                  {sharedCount > 0 && (
                    <Link
                      to="/organization?scope=shared"
                      onClick={closeDrawer}
                      className={`sidebar-org-subitem ${
                        location.pathname === '/organization' && currentOrgScopeParam === 'shared' ? 'active' : ''
                      }`}
                    >
                      <Users size={14} />
                      <span className="sidebar-subitem-label">Shared With Me</span>
                      <span className="sidebar-subitem-count">{sharedCount}</span>
                    </Link>
                  )}

                  {trashedProjects.length > 0 && (
                    <Link
                      to="/organization?scope=trash"
                      onClick={closeDrawer}
                      className={`sidebar-org-subitem ${
                        location.pathname === '/organization' && currentOrgScopeParam === 'trash' ? 'active' : ''
                      }`}
                    >
                      <Trash2 size={14} />
                      <span className="sidebar-subitem-label">Trash</span>
                      <span className="sidebar-subitem-count danger">{trashedProjects.length}</span>
                    </Link>
                  )}

                  <Link
                    to="/organization?createOrg=1"
                    onClick={closeDrawer}
                    className="sidebar-org-subitem add-org"
                  >
                    <Plus size={14} />
                    <span className="sidebar-subitem-label">New Organization</span>
                  </Link>
                </div>
              )}
            </div>

            <NavLink to="/onboarding" onClick={closeDrawer} className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
              <PlusCircle size={19} aria-hidden="true" />
              <span>New Project</span>
            </NavLink>
            <NavLink to="/access" onClick={closeDrawer} className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={19} aria-hidden="true" />
              <span>Access &amp; Teams</span>
            </NavLink>
            <NavLink to="/billing" onClick={closeDrawer} className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
              <CreditCard size={19} aria-hidden="true" />
              <span>Billing &amp; Plan</span>
              {!hasActiveSubscription && !hasSharedAccess && <span className="sidebar-badge-required">Required</span>}
            </NavLink>
            <NavLink to="/settings" onClick={closeDrawer} className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
              <Settings size={19} aria-hidden="true" />
              <span>Org Settings</span>
            </NavLink>
          </nav>
        )}

        <div className="sidebar-footer">
          <NavLink
            to="/support"
            onClick={closeDrawer}
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <HelpCircle size={18} aria-hidden="true" />
            <span>Support &amp; Docs</span>
          </NavLink>

          {isSandboxMode ? (
            <div className="sidebar-sandbox-user">
              <div className="sidebar-sandbox-avatar">LS</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">Local Sandbox Mode</span>
                <span className="sidebar-user-email">localhost preview ({userTier})</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
              <UserButton
                afterSignOutUrl="https://gtmobserver.com"
                appearance={{ elements: { userButtonAvatarBox: { width: '2.5rem', height: '2.5rem' } } }}
              />
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="sidebar-user-email">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
