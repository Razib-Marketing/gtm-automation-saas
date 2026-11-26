import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, useUser, useOrganization } from '@clerk/clerk-react';
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
  hasActiveSubscription: boolean;
  hasSharedAccess: boolean;
  googleConnected: boolean;
  organizations: Organization[];
  projects: Project[];
  trashedProjects: Project[];
  activeOrgId: ActiveOrgScope;
  setActiveOrgId: (scope: ActiveOrgScope) => void;
  clerkOrg: { id: string; name: string } | null;
  loading: boolean;
  isSandboxMode: boolean;
  refreshWorkspace: () => Promise<void>;
  getProjectById: (id?: string) => Project | undefined;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  userTier: 'free',
  hasActiveSubscription: false,
  hasSharedAccess: false,
  googleConnected: false,
  organizations: [],
  projects: [],
  trashedProjects: [],
  activeOrgId: 'all',
  setActiveOrgId: () => {},
  clerkOrg: null,
  loading: true,
  isSandboxMode: false,
  refreshWorkspace: async () => {},
  getProjectById: () => undefined
});

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { organization: clerkOrganization } = useOrganization();

  const [userTier, setUserTier] = useState<'free' | 'pro' | 'custom'>('free');
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

  const clerkOrg = clerkOrganization
    ? { id: clerkOrganization.id, name: clerkOrganization.name }
    : null;

  const loadWorkspace = useCallback(async () => {
    if (!effectiveLoaded) return;

    if (isSandboxMode) {
      const s = getSandboxState();
      const enriched = getEnrichedSandboxProjects();
      const activeList = enriched.filter((p) => p.status !== 'trashed');
      const trashedList = enriched.filter((p) => p.status === 'trashed');
      setUserTier(s.tier);
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
      setHasSharedAccess(false);
      setGoogleConnected(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const email = user.primaryEmailAddress?.emailAddress || '';
      const orgNameQuery = clerkOrganization?.name
        ? `?clerkOrgName=${encodeURIComponent(clerkOrganization.name)}`
        : '';

      const [meRes, authRes, orgRes, projRes] = await Promise.all([
        fetch(`/api/user/me?clerkUserId=${user.id}&email=${encodeURIComponent(email)}`),
        fetch(`/api/auth/status?clerkUserId=${user.id}`),
        token
          ? fetch(`/api/organizations${orgNameQuery}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          : Promise.resolve(null),
        fetch(`/api/projects?clerkUserId=${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
      ]);

      const meData = await meRes.json().catch(() => ({}));
      const authData = await authRes.json().catch(() => ({}));
      const orgData = orgRes ? await orgRes.json().catch(() => ({})) : {};
      const projData = await projRes.json().catch(() => ({}));

      if (meRes.ok && meData?.subscription_tier) {
        setUserTier(meData.subscription_tier);
      }
      setHasSharedAccess(Boolean(meData?.has_shared_access));

      if (authRes.ok) {
        setGoogleConnected(Boolean(authData?.hasAuth));
      }
      if (orgRes?.ok && Array.isArray(orgData?.organizations)) {
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
  }, [effectiveLoaded, isSandboxMode, isSignedIn, user, getToken, clerkOrganization?.id, clerkOrganization?.name]);

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

  return (
    <WorkspaceContext.Provider
      value={{
        userTier,
        hasActiveSubscription,
        hasSharedAccess,
        googleConnected,
        organizations,
        projects,
        trashedProjects,
        activeOrgId,
        setActiveOrgId,
        clerkOrg,
        loading,
        isSandboxMode,
        refreshWorkspace: loadWorkspace,
        getProjectById
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
