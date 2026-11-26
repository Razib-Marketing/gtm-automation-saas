import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { Project, Organization } from '../types/project';
import {
  isLocalhost,
  getSandboxState,
  getEnrichedSandboxProjects,
  SANDBOX_EVENT
} from '../utils/localDemoStore';

export type ActiveOrgScope = 'all' | 'personal' | 'shared' | 'trash' | string;

interface WorkspaceContextValue {
  userTier: 'free' | 'pro' | 'custom';
  workspaceLimit: number;
  hasActiveSubscription: boolean;
  hasPolarCustomer: boolean;
  hasSharedAccess: boolean;
  googleConnected: boolean;
  organizations: Organization[];
  projects: Project[];
  trashedProjects: Project[];
  activeOrgId: ActiveOrgScope;
  setActiveOrgId: (scope: ActiveOrgScope) => void;
  loading: boolean;
  isSandboxMode: boolean;
  refreshWorkspace: () => Promise<void>;
  getProjectById: (id?: string) => Project | undefined;
  getOrganizationById: (id?: string) => Organization | undefined;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  userTier: 'free',
  workspaceLimit: 0,
  hasActiveSubscription: false,
  hasPolarCustomer: false,
  hasSharedAccess: false,
  googleConnected: false,
  organizations: [],
  projects: [],
  trashedProjects: [],
  activeOrgId: 'all',
  setActiveOrgId: () => {},
  loading: true,
  isSandboxMode: false,
  refreshWorkspace: async () => {},
  getProjectById: () => undefined,
  getOrganizationById: () => undefined
});

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [userTier, setUserTier] = useState<'free' | 'pro' | 'custom'>('free');
  const [workspaceLimit, setWorkspaceLimit] = useState<number>(0);
  const [hasPolarCustomer, setHasPolarCustomer] = useState(false);
  const [hasSharedAccess, setHasSharedAccess] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [trashedProjects, setTrashedProjects] = useState<Project[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<ActiveOrgScope>('all');
  const [loading, setLoading] = useState(true);
  const [clerkTimedOutLocally, setClerkTimedOutLocally] = useState(false);

  const localEnv = isLocalhost();

  useEffect(() => {
    if (!localEnv || isLoaded) return;
    const t = setTimeout(() => {
      setClerkTimedOutLocally(true);
    }, 1800);
    return () => clearTimeout(t);
  }, [localEnv, isLoaded]);

  const effectiveLoaded = isLoaded || clerkTimedOutLocally;
  const isSandboxMode = localEnv && effectiveLoaded && !isSignedIn;

  const loadWorkspace = useCallback(async () => {
    if (!effectiveLoaded) return;

    if (isSandboxMode) {
      const s = getSandboxState();
      const enriched = getEnrichedSandboxProjects();
      const activeList = enriched.filter((p) => p.status !== 'trashed');
      const trashedList = enriched.filter((p) => p.status === 'trashed');
      setUserTier(s.tier);
      setWorkspaceLimit(s.tier === 'custom' ? 100 : s.tier === 'pro' ? 10 : 0);
      setHasPolarCustomer(false);
      setHasSharedAccess(false);
      setGoogleConnected(s.googleConnected);
      setOrganizations(
        (s.organizations || []).map((o) => ({
          ...o,
          projectCount: activeList.filter((p) => p.organization_id === o.id).length,
          trashedCount: trashedList.filter((p) => p.organization_id === o.id).length,
          memberCount: (o.members || []).length
        }))
      );
      setProjects(activeList);
      setTrashedProjects(trashedList);
      setLoading(false);
      return;
    }

    if (!isSignedIn || !user) {
      setOrganizations([]);
      setProjects([]);
      setTrashedProjects([]);
      setUserTier('free');
      setWorkspaceLimit(0);
      setHasPolarCustomer(false);
      setHasSharedAccess(false);
      setGoogleConnected(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const authHeaders = { Authorization: `Bearer ${token}` };
      const email = user.primaryEmailAddress?.emailAddress || '';

      const [meRes, authRes, orgRes, projRes] = await Promise.all([
        fetch(`/api/user/me?email=${encodeURIComponent(email)}`, { headers: authHeaders }),
        fetch('/api/auth/status', { headers: authHeaders }),
        fetch('/api/organizations', { headers: authHeaders }),
        fetch('/api/projects', { headers: authHeaders })
      ]);

      const meData = await meRes.json().catch(() => ({}));
      const authData = await authRes.json().catch(() => ({}));
      const orgData = await orgRes.json().catch(() => ({}));
      const projData = await projRes.json().catch(() => ({}));

      if (meRes.ok && meData?.subscription_tier) {
        setUserTier(meData.subscription_tier);
        setWorkspaceLimit(Number(meData.workspace_limit || 0));
        setHasPolarCustomer(Boolean(meData.has_polar_customer));
      }
      setHasSharedAccess(Boolean(meData?.has_shared_access));

      if (authRes.ok) {
        setGoogleConnected(Boolean(authData?.hasAuth));
      }
      if (orgRes.ok && Array.isArray(orgData?.organizations)) {
        setOrganizations(orgData.organizations);
      }
      if (projRes.ok && Array.isArray(projData?.projects)) {
        setProjects(projData.projects);
        setTrashedProjects(Array.isArray(projData?.trashedProjects) ? projData.trashedProjects : []);
      }
    } catch (err) {
      console.error('Failed to load workspace context:', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveLoaded, isSandboxMode, isSignedIn, user, getToken]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!isSandboxMode) return;
    const onSandboxUpdate = () => {
      const s = getSandboxState();
      const enriched = getEnrichedSandboxProjects();
      const activeList = enriched.filter((p) => p.status !== 'trashed');
      const trashedList = enriched.filter((p) => p.status === 'trashed');
      setUserTier(s.tier);
      setWorkspaceLimit(s.tier === 'custom' ? 100 : s.tier === 'pro' ? 10 : 0);
      setGoogleConnected(s.googleConnected);
      setOrganizations(
        (s.organizations || []).map((o) => ({
          ...o,
          projectCount: activeList.filter((p) => p.organization_id === o.id).length,
          trashedCount: trashedList.filter((p) => p.organization_id === o.id).length,
          memberCount: (o.members || []).length
        }))
      );
      setProjects(activeList);
      setTrashedProjects(trashedList);
    };
    window.addEventListener(SANDBOX_EVENT, onSandboxUpdate);
    return () => window.removeEventListener(SANDBOX_EVENT, onSandboxUpdate);
  }, [isSandboxMode]);

  const hasActiveSubscription = userTier === 'pro' || userTier === 'custom';

  const getProjectById = useCallback(
    (id?: string) => {
      if (!id) return undefined;
      return projects.find((p) => p.id === id);
    },
    [projects]
  );

  const getOrganizationById = useCallback(
    (id?: string) => {
      if (!id) return undefined;
      return organizations.find((o) => o.id === id);
    },
    [organizations]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        userTier,
        workspaceLimit,
        hasActiveSubscription,
        hasPolarCustomer,
        hasSharedAccess,
        googleConnected,
        organizations,
        projects,
        trashedProjects,
        activeOrgId,
        setActiveOrgId,
        loading,
        isSandboxMode,
        refreshWorkspace: loadWorkspace,
        getProjectById,
        getOrganizationById
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const SubscriptionGate: React.FC<{
  children: React.ReactNode;
  allowFree?: boolean;
}> = ({ children, allowFree = false }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { hasActiveSubscription, hasSharedAccess, projects, loading, isSandboxMode } = useWorkspace();
  const location = useLocation();
  const [waitExpired, setWaitExpired] = useState(false);

  useEffect(() => {
    if (!isLocalhost() || isLoaded) return;
    const t = setTimeout(() => setWaitExpired(true), 1800);
    return () => clearTimeout(t);
  }, [isLoaded]);

  const ready = isLoaded || (isLocalhost() && waitExpired);

  if (!ready || loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.85rem',
          color: '#9CA3AF'
        }}
      >
        <Loader2 className="animate-spin" size={32} color="#00F0FF" />
        <span style={{ fontSize: '0.9rem' }}>Loading organization workspace...</span>
      </div>
    );
  }

  if (!isSignedIn && !isSandboxMode) {
    return <Navigate to={`/sign-in?redirect_url=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (!allowFree && !hasActiveSubscription && !hasSharedAccess && projects.length === 0) {
    return <Navigate to="/billing?reason=subscription_required" replace />;
  }

  return <>{children}</>;
};
