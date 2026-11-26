import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth, useUser, useOrganization, useOrganizationList, useSession } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { Project, Organization } from '../types/project';
import {
  isLocalhost,
  getSandboxState,
  getEnrichedSandboxProjects,
  deleteSandboxOrganization,
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
  clerkOrgId: string | null;
  clerkOrgName: string | null;
  clerkOrgRole: string | null;
  activeClerkMirrorOrg: Organization | null;
  organizations: Organization[];
  projects: Project[];
  trashedProjects: Project[];
  activeOrgId: ActiveOrgScope;
  setActiveOrgId: (scope: ActiveOrgScope) => void;
  loading: boolean;
  isSandboxMode: boolean;
  refreshWorkspace: () => Promise<void>;
  removeOrganization: (org: Organization) => Promise<{ ok: boolean; error?: string }>;
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
  clerkOrgId: null,
  clerkOrgName: null,
  clerkOrgRole: null,
  activeClerkMirrorOrg: null,
  organizations: [],
  projects: [],
  trashedProjects: [],
  activeOrgId: 'all',
  setActiveOrgId: () => {},
  loading: true,
  isSandboxMode: false,
  refreshWorkspace: async () => {},
  removeOrganization: async () => ({ ok: false }),
  getProjectById: () => undefined,
  getOrganizationById: () => undefined
});

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, orgId, orgRole, getToken } = useAuth();
  const { user } = useUser();
  const { organization: clerkOrg } = useOrganization();
  const { userMemberships, setActive } = useOrganizationList({ userMemberships: { infinite: true } });

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
      const orgEndpoint = clerkOrg?.name
        ? `/api/organizations?clerkOrgName=${encodeURIComponent(clerkOrg.name)}`
        : '/api/organizations';

      // Sync active Clerk Organization into D1 mirror first so downstream checks/projects see it immediately
      const orgRes = await fetch(orgEndpoint, { headers: authHeaders });
      const orgData = await orgRes.json().catch(() => ({}));

      const [meRes, authRes, projRes] = await Promise.all([
        fetch(`/api/user/me?email=${encodeURIComponent(email)}`, { headers: authHeaders }),
        fetch('/api/auth/status', { headers: authHeaders }),
        fetch('/api/projects', { headers: authHeaders })
      ]);

      const meData = await meRes.json().catch(() => ({}));
      const authData = await authRes.json().catch(() => ({}));
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
  }, [effectiveLoaded, isSandboxMode, isSignedIn, user, getToken, orgId, clerkOrg?.name]);

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
  const clerkOrgId = isSandboxMode ? null : orgId || null;
  const clerkOrgName = isSandboxMode ? null : clerkOrg?.name || null;
  const clerkOrgRole = isSandboxMode ? null : orgRole || null;

  const activeClerkMirrorOrg = useMemo(
    () => organizations.find((o) => clerkOrgId && o.clerk_org_id === clerkOrgId) || null,
    [organizations, clerkOrgId]
  );

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

  const removeOrganization = useCallback(
    async (org: Organization): Promise<{ ok: boolean; error?: string }> => {
      if (isSandboxMode) {
        deleteSandboxOrganization(org.id);
        await loadWorkspace();
        return { ok: true };
      }

      try {
        if (org.clerk_org_id) {
          const membershipOrg = userMemberships.data?.find(
            (m) => m.organization.id === org.clerk_org_id
          )?.organization;
          const clerkOrgObj =
            clerkOrg?.id === org.clerk_org_id ? clerkOrg : membershipOrg;

          const nextOrgId = userMemberships.data?.find(
            (m) => m.organization.id !== org.clerk_org_id
          )?.organization.id;

          if (clerkOrgObj) {
            await clerkOrgObj.destroy();
          }

          if (orgId === org.clerk_org_id && setActive && nextOrgId) {
            try {
              await setActive({ organization: nextOrgId });
            } catch (_) {}
          }
        }

        const token = await getToken();
        if (!token) {
          return { ok: false, error: 'Authentication session missing. Please sign in again.' };
        }

        const res = await fetch(`/api/organizations?id=${encodeURIComponent(org.id)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok && res.status !== 404) {
          const data = await res.json().catch(() => ({}));
          return { ok: false, error: data.error || 'Failed to delete organization' };
        }

        if (userMemberships.revalidate) {
          try {
            await userMemberships.revalidate();
          } catch (_) {}
        }

        await loadWorkspace();
        return { ok: true };
      } catch (err: any) {
        const msg =
          err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          err?.message ||
          'Failed to remove organization';
        return { ok: false, error: msg };
      }
    },
    [isSandboxMode, clerkOrg, orgId, userMemberships, setActive, getToken, loadWorkspace]
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
        clerkOrgId,
        clerkOrgName,
        clerkOrgRole,
        activeClerkMirrorOrg,
        organizations,
        projects,
        trashedProjects,
        activeOrgId,
        setActiveOrgId,
        loading,
        isSandboxMode,
        refreshWorkspace: loadWorkspace,
        removeOrganization,
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
  const { session } = useSession();
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

  if (!isSandboxMode && session?.currentTask?.key === 'choose-organization') {
    return <Navigate to="/choose-organization" replace />;
  }

  if (!allowFree && !hasActiveSubscription && !hasSharedAccess && projects.length === 0) {
    return <Navigate to="/billing?reason=subscription_required" replace />;
  }

  return <>{children}</>;
};
