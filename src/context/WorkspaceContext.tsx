import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { Project } from '../types/project';
import {
  isLocalhost,
  getSandboxState,
  getEnrichedSandboxProjects,
  SANDBOX_EVENT
} from '../utils/localDemoStore';

interface WorkspaceContextValue {
  userTier: 'free' | 'pro' | 'custom';
  hasActiveSubscription: boolean;
  googleConnected: boolean;
  projects: Project[];
  loading: boolean;
  isSandboxMode: boolean;
  refreshWorkspace: () => Promise<void>;
  getProjectById: (id?: string) => Project | undefined;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  userTier: 'free',
  hasActiveSubscription: false,
  googleConnected: false,
  projects: [],
  loading: true,
  isSandboxMode: false,
  refreshWorkspace: async () => {},
  getProjectById: () => undefined
});

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [userTier, setUserTier] = useState<'free' | 'pro' | 'custom'>('free');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [clerkTimedOutLocally, setClerkTimedOutLocally] = useState(false);

  const localEnv = isLocalhost();

  // If Clerk pk_live_ takes too long or errors on localhost, unlock Local Sandbox gracefully
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
      setUserTier(s.tier);
      setGoogleConnected(s.googleConnected);
      setProjects(getEnrichedSandboxProjects());
      setLoading(false);
      return;
    }

    if (!isSignedIn || !user) {
      setProjects([]);
      setUserTier('free');
      setGoogleConnected(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const email = user.primaryEmailAddress?.emailAddress || '';

      const [meRes, authRes, projRes] = await Promise.all([
        fetch(`/api/user/me?clerkUserId=${user.id}&email=${encodeURIComponent(email)}`),
        fetch(`/api/auth/status?clerkUserId=${user.id}`),
        fetch(`/api/projects?clerkUserId=${user.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
      ]);

      const meData = await meRes.json().catch(() => ({}));
      const authData = await authRes.json().catch(() => ({}));
      const projData = await projRes.json().catch(() => ({}));

      if (meRes.ok && meData?.subscription_tier) {
        setUserTier(meData.subscription_tier);
      }
      if (authRes.ok) {
        setGoogleConnected(Boolean(authData?.hasAuth));
      }
      if (projRes.ok && Array.isArray(projData?.projects)) {
        setProjects(projData.projects);
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
      setUserTier(s.tier);
      setGoogleConnected(s.googleConnected);
      setProjects(getEnrichedSandboxProjects());
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
        googleConnected,
        projects,
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
  const { hasActiveSubscription, loading, isSandboxMode } = useWorkspace();
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

  if (!allowFree && !hasActiveSubscription) {
    return <Navigate to="/billing?reason=subscription_required" replace />;
  }

  return <>{children}</>;
};
