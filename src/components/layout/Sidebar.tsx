import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { LayoutDashboard, FolderKanban, BarChart3, Settings, HelpCircle, Activity } from 'lucide-react';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { user } = useUser();

  return (
    <aside className="global-sidebar">
      <div className="sidebar-header">
        <img src="/gtmauto-logo.webp" alt="GTMAuto Logo" style={{ height: '32px', width: 'auto' }} />
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/observer" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
          <Activity size={20} />
          <span>Observer</span>
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
          <FolderKanban size={20} />
          <span>Projects</span>
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
          <BarChart3 size={20} />
          <span>Analytics</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/support" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`} style={{ width: '100%', justifyContent: 'flex-start' }}>
          <HelpCircle size={18} />
          <span>Support & Docs</span>
        </NavLink>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: { width: '2.5rem', height: '2.5rem' } } }} />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.firstName} {user?.lastName}</span>
            <span className="sidebar-user-email">{user?.primaryEmailAddress?.emailAddress}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
