import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
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
  Trash2
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ClerkOrgSwitcherWidget } from '../ui/ClerkOrgBoundary';
import { getWebsiteTypeMeta } from '../../types/project';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();
  const {
    userTier,
    hasActiveSubscription,
    hasSharedAccess,
    trashedProjects,
    isSandboxMode,
    getProjectById
  } = useWorkspace();

  const [drawerOpen, setDrawerOpen] = useState(false);
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
  const typeMeta = activeProject ? getWebsiteTypeMeta(activeProject.website_type) : null;

  // Sync viewport size cleanly via matchMedia
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

  // Auto-close drawer on navigation change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  // Manage modal dialog modality, Escape key, and focus restoration ONLY when acting as mobile drawer
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
      {/* Sticky Top Header shown below 1024px (Phones & Tablets) */}
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
              {isProjectMode ? activeProject?.name || 'Project Workspace' : 'Organization'}
            </span>
            <span className="mobile-app-context-sub">
              {isProjectMode ? 'PROJECT' : `${userTier.toUpperCase()} PLAN`}
            </span>
          </div>
        </div>

        <div className="mobile-app-topbar-right">
          {isProjectMode ? (
            <Link to="/organization" className="mobile-topbar-quick-btn" title="All Projects">
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Org</span>
            </Link>
          ) : (
            <Link to="/onboarding" className="mobile-topbar-quick-btn accent" title="New Project">
              <PlusCircle size={16} aria-hidden="true" />
              <span>New</span>
            </Link>
          )}
        </div>
      </header>

      {/* Dimmed Backdrop while Mobile/Tablet Drawer is Open */}
      {drawerOpen && isMobileViewport && (
        <div
          className="sidebar-backdrop"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Unified Semantic Sidebar (Desktop sticky sidebar >=1024px, Slide-over dialog drawer <1024px) */}
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

          {!isProjectMode ? (
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
          ) : (
            <div className="sidebar-project-context">
              <Link to="/organization" onClick={closeDrawer} className="sidebar-back-org">
                <ArrowLeft size={14} aria-hidden="true" />
                <span>All Projects (Organization)</span>
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
          )}
        </div>

        {!isProjectMode ? (
          <nav className="sidebar-nav" aria-label="Organization Navigation">
            <NavLink to="/organization" onClick={closeDrawer} className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
              <FolderKanban size={19} aria-hidden="true" />
              <span>Organization</span>
              {trashedProjects.length > 0 && (
                <span
                  title={`${trashedProjects.length} trashed project(s)`}
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.12rem 0.42rem',
                    borderRadius: '9999px',
                    background: 'rgba(239, 68, 68, 0.14)',
                    color: '#FCA5A5',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <Trash2 size={10} /> {trashedProjects.length}
                </span>
              )}
            </NavLink>
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
        ) : (
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
