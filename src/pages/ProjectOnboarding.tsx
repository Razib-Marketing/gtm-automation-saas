import React, { useEffect, useState, useMemo } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FolderPlus,
  BarChart3,
  Code2,
  Bell,
  Loader2,
  ExternalLink,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Globe,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { PageTransition } from '../components/ui/PageTransition';
import { useWorkspace } from '../context/WorkspaceContext';
import { WEBSITE_TYPES, getWebsiteTypeMeta } from '../types/project';
import type { WebsitePerspective } from '../types/project';
import {
  INCIDENT_TEMPLATES,
  COMPARISON_PERIODS,
  GA4_METRICS,
  getTimezoneOptions,
  getBrowserTimezone,
  formatConditionRuleBadge
} from '../data/observerTemplates';
import type { ConditionOperator, IncidentTemplate } from '../data/observerTemplates';
import {
  SANDBOX_GA4_PROPERTIES,
  SANDBOX_GTM_ACCOUNTS,
  SANDBOX_GTM_CONTAINERS,
  SANDBOX_GTM_WORKSPACES,
  setSandboxGoogleConnected,
  addSandboxProject,
  addSandboxMonitor
} from '../utils/localDemoStore';
import './Dashboard.css';

const DRAFT_KEY = 'gtmobserver_onboarding_draft_v1';

interface CustomRuleDraft {
  id: string;
  metric: string;
  conditionType: ConditionOperator;
  thresholdPercentage: number;
  source: string;
}

export const ProjectOnboarding: React.FC = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSandboxMode, googleConnected, organizations, activeOrgId, refreshWorkspace } = useWorkspace();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Project Info
  const [projectName, setProjectName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteType, setWebsiteType] = useState<WebsitePerspective>('general');
  const [organizationId, setOrganizationId] = useState<string>(() =>
    activeOrgId && !['all', 'personal', 'shared', 'trash'].includes(activeOrgId) ? activeOrgId : ''
  );

  // Step 2: Google Analytics (GA4)
  const [localGoogleConnected, setLocalGoogleConnected] = useState(googleConnected);
  const [ga4Properties, setGa4Properties] = useState<any[]>([]);
  const [loadingGa4, setLoadingGa4] = useState(false);
  const [selectedGa4PropertyId, setSelectedGa4PropertyId] = useState('');
  const [ga4Search, setGa4Search] = useState('');

  // Step 3: Google Tag Manager (GTM)
  const [gtmAccounts, setGtmAccounts] = useState<any[]>([]);
  const [gtmContainers, setGtmContainers] = useState<any[]>([]);
  const [gtmWorkspaces, setGtmWorkspaces] = useState<any[]>([]);
  const [selectedGtmAccountId, setSelectedGtmAccountId] = useState('');
  const [selectedGtmContainerId, setSelectedGtmContainerId] = useState('');
  const [selectedGtmWorkspaceId, setSelectedGtmWorkspaceId] = useState('');
  const [measurementId, setMeasurementId] = useState('');
  const [loadingGtm, setLoadingGtm] = useState(false);

  // Step 4: Initial Triggers & Rules
  const [ruleMode, setRuleMode] = useState<'templates' | 'custom' | 'skip'>('templates');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [customPeriod, setCustomPeriod] = useState('yesterday_vs_last_week');
  const [customRules, setCustomRules] = useState<CustomRuleDraft[]>([
    { id: 'r1', metric: 'sessions', conditionType: 'drops_below', thresholdPercentage: 25, source: 'all' }
  ]);
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [scheduleTimezone, setScheduleTimezone] = useState(() => getBrowserTimezone());
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [alertEmails, setAlertEmails] = useState<string>(() =>
    user?.primaryEmailAddress?.emailAddress || 'alerts@example.com'
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const params = new URLSearchParams(location.search);
  const justCheckedOut = params.get('checkout') === 'success';
  const justAuthedGoogle = params.get('auth') === 'success';

  useEffect(() => {
    setLocalGoogleConnected(googleConnected);
  }, [googleConnected]);

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress && alertEmails === 'alerts@example.com') {
      setAlertEmails(user.primaryEmailAddress.emailAddress);
    }
  }, [user, alertEmails]);

  // Restore draft after Google OAuth return
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.projectName) setProjectName(parsed.projectName);
        if (parsed.websiteUrl) setWebsiteUrl(parsed.websiteUrl);
        if (parsed.websiteType) setWebsiteType(parsed.websiteType);
        if (justAuthedGoogle && parsed.step) {
          setStep(parsed.step);
          setLocalGoogleConnected(true);
        }
        window.sessionStorage.removeItem(DRAFT_KEY);
      }
    } catch (_) {}
  }, [justAuthedGoogle]);

  // Load GA4 properties & GTM accounts once Google is connected
  useEffect(() => {
    if (!localGoogleConnected) return;

    if (isSandboxMode) {
      setGa4Properties(SANDBOX_GA4_PROPERTIES);
      setGtmAccounts(SANDBOX_GTM_ACCOUNTS);
      if (!selectedGa4PropertyId && SANDBOX_GA4_PROPERTIES[0]) {
        setSelectedGa4PropertyId(SANDBOX_GA4_PROPERTIES[0].name);
      }
      if (!selectedGtmAccountId && SANDBOX_GTM_ACCOUNTS[0]) {
        setSelectedGtmAccountId(SANDBOX_GTM_ACCOUNTS[0].accountId);
      }
      return;
    }

    const loadGoogleResources = async () => {
      setLoadingGa4(true);
      setLoadingGtm(true);
      try {
        const token = await getToken();
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };

        const [ga4Res, gtmRes] = await Promise.all([
          fetch('/api/ga4/properties', { headers }),
          fetch('/api/gtm/accounts', { headers })
        ]);
        const ga4Data = await ga4Res.json().catch(() => ({}));
        const gtmData = await gtmRes.json().catch(() => ({}));

        if (ga4Res.ok && Array.isArray(ga4Data.properties)) {
          setGa4Properties(ga4Data.properties);
        }
        if (gtmRes.ok && Array.isArray(gtmData.account)) {
          setGtmAccounts(gtmData.account);
        }
      } catch (err) {
        console.error('Failed loading Google resources during onboarding:', err);
      } finally {
        setLoadingGa4(false);
        setLoadingGtm(false);
      }
    };

    loadGoogleResources();
  }, [localGoogleConnected, isSandboxMode, getToken]);

  // Load GTM containers when GTM account changes
  useEffect(() => {
    setGtmWorkspaces([]);
    setSelectedGtmWorkspaceId('');
    if (!selectedGtmAccountId) {
      setGtmContainers([]);
      setSelectedGtmContainerId('');
      return;
    }

    if (isSandboxMode) {
      const list = SANDBOX_GTM_CONTAINERS[selectedGtmAccountId] || [];
      setGtmContainers(list);
      if (list[0] && !list.some((c) => c.containerId === selectedGtmContainerId)) {
        setSelectedGtmContainerId(list[0].containerId);
      }
      return;
    }

    const fetchContainers = async () => {
      setLoadingGtm(true);
      try {
        const token = await getToken();
        const res = await fetch(`/api/gtm/containers?accountId=${selectedGtmAccountId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        const containerList = Array.isArray(data.container) ? data.container : [];
        setGtmContainers(containerList);
        if (containerList.length === 0) {
          setSelectedGtmContainerId('');
        } else if (!containerList.some((c: any) => c.containerId === selectedGtmContainerId)) {
          setSelectedGtmContainerId(containerList[0].containerId);
        }
      } catch (_) {
        setGtmContainers([]);
        setSelectedGtmContainerId('');
      } finally {
        setLoadingGtm(false);
      }
    };
    fetchContainers();
  }, [selectedGtmAccountId, isSandboxMode, getToken]);

  // Load GTM workspaces when GTM container changes
  useEffect(() => {
    if (!selectedGtmAccountId || !selectedGtmContainerId) {
      setGtmWorkspaces([]);
      setSelectedGtmWorkspaceId('');
      return;
    }

    if (isSandboxMode) {
      const list = SANDBOX_GTM_WORKSPACES[selectedGtmContainerId] || [{ workspaceId: '1', name: 'Default Workspace' }];
      setGtmWorkspaces(list);
      if (list[0] && !list.some((w) => w.workspaceId === selectedGtmWorkspaceId)) {
        setSelectedGtmWorkspaceId(list[0].workspaceId);
      }
      return;
    }

    const fetchWorkspaces = async () => {
      setLoadingGtm(true);
      try {
        const token = await getToken();
        const containerPath = `accounts/${selectedGtmAccountId}/containers/${selectedGtmContainerId}`;
        const res = await fetch(
          `/api/gtm/workspaces?containerPath=${encodeURIComponent(containerPath)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json().catch(() => ({}));
        const wsList = Array.isArray(data.workspace) ? data.workspace : [];
        setGtmWorkspaces(wsList);
        if (wsList.length === 0) {
          setSelectedGtmWorkspaceId('');
        } else if (!wsList.some((w: any) => w.workspaceId === selectedGtmWorkspaceId)) {
          setSelectedGtmWorkspaceId(wsList[0].workspaceId);
        }
      } catch (_) {
        setGtmWorkspaces([]);
        setSelectedGtmWorkspaceId('');
      } finally {
        setLoadingGtm(false);
      }
    };
    fetchWorkspaces();
  }, [selectedGtmAccountId, selectedGtmContainerId, isSandboxMode, getToken]);

  // Pre-recommend matching templates when websiteType changes
  useEffect(() => {
    const matching = INCIDENT_TEMPLATES.filter((t) => t.websiteType === websiteType);
    const defaultPick = matching.length > 0 ? [matching[0].id] : [INCIDENT_TEMPLATES[0].id];
    setSelectedTemplateIds(defaultPick);
  }, [websiteType]);

  const sortedTemplates = useMemo(() => {
    return [...INCIDENT_TEMPLATES].sort((a, b) => {
      const aMatch = a.websiteType === websiteType ? 0 : 1;
      const bMatch = b.websiteType === websiteType ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [websiteType]);

  const filteredGa4Props = useMemo(() => {
    if (!ga4Search.trim()) return ga4Properties;
    const q = ga4Search.toLowerCase();
    return ga4Properties.filter(
      (p) => (p.displayName || '').toLowerCase().includes(q) || (p.name || '').toLowerCase().includes(q)
    );
  }, [ga4Properties, ga4Search]);

  const selectedGa4Obj = ga4Properties.find((p) => p.name === selectedGa4PropertyId);
  const selectedGtmAccountObj = gtmAccounts.find((a) => a.accountId === selectedGtmAccountId);
  const selectedGtmContainerObj = gtmContainers.find((c) => c.containerId === selectedGtmContainerId);
  const selectedGtmWorkspaceObj = gtmWorkspaces.find((w) => w.workspaceId === selectedGtmWorkspaceId);

  const handleConnectGoogle = () => {
    if (isSandboxMode) {
      setSandboxGoogleConnected(true);
      setLocalGoogleConnected(true);
      return;
    }
    try {
      window.sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ projectName, websiteUrl, websiteType, step })
      );
    } catch (_) {}
    window.location.href = `/api/auth/google/login?clerkUserId=${encodeURIComponent(
      user?.id || ''
    )}&returnTo=${encodeURIComponent('/onboarding')}`;
  };

  const toggleTemplateSelection = (id: string) => {
    setSelectedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddCustomRule = () => {
    setCustomRules((prev) => [
      ...prev,
      {
        id: 'r_' + Date.now(),
        metric: 'keyEvents',
        conditionType: 'drops_below',
        thresholdPercentage: 30,
        source: 'all'
      }
    ]);
  };

  const handleCreateProject = async () => {
    setErrorMsg('');
    if (!projectName.trim()) {
      setErrorMsg('Please enter a project name in Step 1.');
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: projectName.trim(),
        websiteUrl: websiteUrl.trim(),
        websiteType,
        organizationId: organizationId || null,
        ga4PropertyId: selectedGa4PropertyId || null,
        ga4PropertyName: selectedGa4Obj?.displayName || selectedGa4PropertyId || null,
        gtmAccountId: selectedGtmAccountId || null,
        gtmAccountName: selectedGtmAccountObj?.name || null,
        gtmContainerId: selectedGtmContainerId || null,
        gtmContainerName: selectedGtmContainerObj?.name || null,
        gtmContainerPublicId: selectedGtmContainerObj?.publicId || null,
        gtmWorkspaceId: selectedGtmWorkspaceId || null,
        gtmWorkspaceName: selectedGtmWorkspaceObj?.name || null,
        measurementId: measurementId.trim() || null
      };

      let createdProjectId = '';

      if (isSandboxMode) {
        const created = addSandboxProject({
          name: payload.name,
          website_url: payload.websiteUrl,
          website_type: payload.websiteType,
          organization_id: payload.organizationId,
          ga4_property_id: payload.ga4PropertyId,
          ga4_property_name: payload.ga4PropertyName,
          gtm_account_id: payload.gtmAccountId,
          gtm_account_name: payload.gtmAccountName,
          gtm_container_id: payload.gtmContainerId,
          gtm_container_name: payload.gtmContainerName,
          gtm_container_public_id: payload.gtmContainerPublicId,
          gtm_workspace_id: payload.gtmWorkspaceId,
          gtm_workspace_name: payload.gtmWorkspaceName,
          measurement_id: payload.measurementId
        });
        createdProjectId = created.id;

        if (payload.ga4PropertyId && ruleMode !== 'skip') {
          if (ruleMode === 'templates') {
            const chosen: IncidentTemplate[] = INCIDENT_TEMPLATES.filter((t) =>
              selectedTemplateIds.includes(t.id)
            );
            chosen.forEach((tpl) => {
              addSandboxMonitor({
                project_id: createdProjectId,
                property_id: payload.ga4PropertyId,
                property_name: payload.ga4PropertyName || payload.ga4PropertyId,
                metric: tpl.conditions[0]?.metric || 'sessions',
                threshold_percentage: tpl.conditions[0]?.thresholdPercentage ?? 20,
                comparison_period: tpl.period,
                alert_email: alertEmails,
                matchType: tpl.matchType,
                scheduleTime,
                scheduleTimezone,
                scheduleFrequency,
                websiteType,
                status: 'active',
                conditions: tpl.conditions
              });
            });
          } else if (ruleMode === 'custom' && customRules.length > 0) {
            addSandboxMonitor({
              project_id: createdProjectId,
              property_id: payload.ga4PropertyId,
              property_name: payload.ga4PropertyName || payload.ga4PropertyId,
              metric: customRules[0].metric,
              threshold_percentage: customRules[0].thresholdPercentage,
              comparison_period: customPeriod,
              alert_email: alertEmails,
              matchType: 'ANY',
              scheduleTime,
              scheduleTimezone,
              scheduleFrequency,
              websiteType,
              status: 'active',
              conditions: customRules.map((r) => ({
                metric: r.metric,
                source: r.source,
                medium: 'all',
                device: 'all',
                conditionType: r.conditionType,
                thresholdPercentage: r.thresholdPercentage
              }))
            });
          }
        }

        await refreshWorkspace();
        navigate(`/organization?created=${encodeURIComponent(createdProjectId)}`);
        return;
      }

      // Production Backend Creation
      const token = await getToken();
      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const projData = await projRes.json().catch(() => ({}));

      if (!projRes.ok || !projData?.project?.id) {
        throw new Error(projData.error || 'Failed to create project');
      }

      createdProjectId = projData.project.id;

      // Create initial GA4 Observer monitors if GA4 property selected & rules requested
      if (payload.ga4PropertyId && ruleMode !== 'skip') {
        const parsedRecipients = alertEmails
          .split(/[,;\s]+/)
          .map((e) => e.trim())
          .filter((e) => e.includes('@'));

        if (parsedRecipients.length > 0) {
          if (ruleMode === 'templates') {
            const chosen = INCIDENT_TEMPLATES.filter((t) => selectedTemplateIds.includes(t.id));
            for (const tpl of chosen) {
              await fetch('/api/ga4/monitors', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  projectId: createdProjectId,
                  propertyId: payload.ga4PropertyId,
                  propertyName: payload.ga4PropertyName || payload.ga4PropertyId,
                  comparisonPeriod: tpl.period,
                  matchType: tpl.matchType,
                  conditions: tpl.conditions,
                  alertEmails: parsedRecipients,
                  scheduleTime,
                  scheduleTimezone,
                  scheduleFrequency,
                  websiteType
                })
              }).catch(() => {});
            }
          } else if (ruleMode === 'custom' && customRules.length > 0) {
            await fetch('/api/ga4/monitors', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                projectId: createdProjectId,
                propertyId: payload.ga4PropertyId,
                propertyName: payload.ga4PropertyName || payload.ga4PropertyId,
                comparisonPeriod: customPeriod,
                matchType: 'ANY',
                conditions: customRules.map((r) => ({
                  metric: r.metric,
                  source: r.source,
                  medium: 'all',
                  device: 'all',
                  conditionType: r.conditionType,
                  thresholdPercentage: r.thresholdPercentage
                })),
                alertEmails: parsedRecipients,
                scheduleTime,
                scheduleTimezone,
                scheduleFrequency,
                websiteType
              })
            }).catch(() => {});
          }
        }
      }

      await refreshWorkspace();
      navigate(`/organization?created=${encodeURIComponent(createdProjectId)}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to create project. Please check your configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepsMeta = [
    { num: 1 as const, label: 'Project Details', icon: FolderPlus },
    { num: 2 as const, label: 'Connect GA4', icon: BarChart3 },
    { num: 3 as const, label: 'Connect GTM', icon: Code2 },
    { num: 4 as const, label: 'Triggers & Launch', icon: Bell }
  ];

  const timezoneOptions = useMemo(() => getTimezoneOptions(scheduleTimezone), [scheduleTimezone]);
  const selectedTypeMeta = getWebsiteTypeMeta(websiteType);

  return (
    <PageTransition locationKey="onboarding">
      <BackgroundMesh />
      <div className="dashboard-container" style={{ maxWidth: '980px', margin: '0 auto' }}>
        {justCheckedOut && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.95rem 1.2rem',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#A7F3D0',
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}
          >
            <CheckCircle2 size={20} color="#10B981" style={{ flexShrink: 0 }} />
            <span>
              <strong>Subscription Activated!</strong> Complete this guided onboarding to configure your first dedicated project workspace.
            </span>
          </div>
        )}

        <div className="dashboard-header" style={{ marginBottom: '1.75rem' }}>
          <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <Sparkles size={28} color="#00F0FF" />
            Project Onboarding &amp; Initial Setup
          </h1>
          <p className="dashboard-subtitle">
            Configure your project identity, link Google Analytics 4 and Google Tag Manager, and set initial monitoring triggers.
          </p>
        </div>

        {/* 4-Step Progress Indicator */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 175px), 1fr))',
            gap: '0.75rem',
            marginBottom: '2rem'
          }}
        >
          {stepsMeta.map((s) => {
            const Icon = s.icon;
            const isCurrent = step === s.num;
            const isDone = step > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num === 1 || projectName.trim()) setStep(s.num);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.85rem 0.95rem',
                  borderRadius: '12px',
                  border: isCurrent
                    ? '1px solid rgba(0, 240, 255, 0.55)'
                    : isDone
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(255,255,255,0.08)',
                  background: isCurrent
                    ? 'rgba(0, 240, 255, 0.08)'
                    : isDone
                      ? 'rgba(16, 185, 129, 0.06)'
                      : 'rgba(18, 18, 24, 0.75)',
                  color: isCurrent ? '#00F0FF' : isDone ? '#34D399' : '#9CA3AF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCurrent
                      ? 'rgba(0, 240, 255, 0.16)'
                      : isDone
                        ? 'rgba(16, 185, 129, 0.16)'
                        : 'rgba(255,255,255,0.05)',
                    flexShrink: 0
                  }}
                >
                  {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: 700 }}>STEP {s.num}</div>
                  <div
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      color: isCurrent || isDone ? 'white' : '#9CA3AF',
                      lineHeight: 1.25
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.9rem 1.15rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#FCA5A5',
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step Content Card */}
        <div className="module-card" style={{ padding: 'clamp(1.15rem, 3vw, 2rem)', cursor: 'default' }}>
          <AnimatePresence mode="wait">
            {/* ==================== STEP 1 ==================== */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h2 style={{ margin: '0 0 0.4rem', color: 'white', fontSize: '1.35rem' }}>
                  1. Name &amp; Classify Your Project
                </h2>
                <p style={{ margin: '0 0 1.5rem', color: '#9CA3AF', fontSize: '0.9rem' }}>
                  Each project gets an isolated workspace inside your organization with dedicated GTM deployment, GA4 monitoring, and audits.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                      Project Name <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Harbor Grand Hotel & Resort"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="module-input"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                      Website URL (Optional)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Globe size={16} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="module-input"
                        style={{ width: '100%', paddingLeft: '2.25rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                      Client Organization (Optional)
                    </label>
                    <select
                      value={organizationId}
                      onChange={(e) => setOrganizationId(e.target.value)}
                      className="module-input"
                      style={{ width: '100%' }}
                    >
                      <option value="">Personal Workspace</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.projectCount || 0} websites)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.65rem' }}>
                    Website Perspective / Industry Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.85rem' }}>
                    {WEBSITE_TYPES.map((wt) => {
                      const active = websiteType === wt.value;
                      return (
                        <button
                          key={wt.value}
                          type="button"
                          onClick={() => setWebsiteType(wt.value)}
                          style={{
                            textAlign: 'left',
                            padding: '0.95rem 1rem',
                            borderRadius: '10px',
                            border: active ? `1px solid ${wt.color}` : '1px solid rgba(255,255,255,0.08)',
                            background: active ? `${wt.color}14` : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{wt.label}</span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                color: wt.color,
                                background: `${wt.color}20`
                              }}
                            >
                              {wt.badge}
                            </span>
                          </div>
                          <div style={{ color: '#9CA3AF', fontSize: '0.78rem', lineHeight: 1.45 }}>
                            {wt.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!projectName.trim()) {
                        setErrorMsg('Please enter a project name to continue.');
                        return;
                      }
                      setErrorMsg('');
                      setStep(2);
                    }}
                    className="btn-deploy-bulk"
                    style={{ marginTop: 0, padding: '0.75rem 1.5rem' }}
                  >
                    Next: Connect Google Analytics <ChevronRight size={17} style={{ marginLeft: '0.35rem' }} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ==================== STEP 2 ==================== */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h2 style={{ margin: '0 0 0.4rem', color: 'white', fontSize: '1.35rem' }}>
                  2. Connect Google Analytics (GA4)
                </h2>
                <p style={{ margin: '0 0 1.5rem', color: '#9CA3AF', fontSize: '0.9rem' }}>
                  Select the GA4 Property for <strong>{projectName}</strong>. All dashboards, alerts, and 22-point GA4 audits inside this project will scope exclusively to this property.
                </p>

                {!localGoogleConnected ? (
                  <div
                    style={{
                      padding: '2rem',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px dashed rgba(0, 240, 255, 0.35)',
                      textAlign: 'center'
                    }}
                  >
                    <ShieldCheck size={36} color="#00F0FF" style={{ marginBottom: '0.75rem' }} />
                    <h3 style={{ color: 'white', margin: '0 0 0.4rem', fontSize: '1.1rem' }}>
                      Authorize Google Analytics &amp; Tag Manager
                    </h3>
                    <p style={{ color: '#9CA3AF', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 1.25rem' }}>
                      Connect your Google account via OAuth2 so GTMObserver can list your GA4 Properties and GTM Containers.
                    </p>
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      className="btn-deploy-bulk"
                      style={{ marginTop: 0, padding: '0.8rem 1.6rem' }}
                    >
                      {isSandboxMode ? 'Connect Sample Google Account (Local)' : 'Authorize Google Account →'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        marginBottom: '1rem'
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.82rem',
                          color: '#34D399',
                          fontWeight: 600
                        }}
                      >
                        <CheckCircle2 size={16} /> Google Account Connected
                      </span>
                      <input
                        type="search"
                        placeholder="Search GA4 properties..."
                        value={ga4Search}
                        onChange={(e) => setGa4Search(e.target.value)}
                        className="module-input"
                        style={{ maxWidth: '280px', padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                      />
                    </div>

                    {loadingGa4 ? (
                      <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9CA3AF' }}>
                        <Loader2 className="animate-spin" size={26} color="#00F0FF" style={{ marginBottom: '0.5rem' }} />
                        <div>Loading your GA4 Properties...</div>
                      </div>
                    ) : filteredGa4Props.length === 0 ? (
                      <div style={{ padding: '1.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: '#9CA3AF', fontSize: '0.88rem' }}>
                        No GA4 properties found matching your query. You can still proceed and link GA4 later from Project Settings.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '0.85rem', maxHeight: '290px', overflowY: 'auto' }}>
                        {filteredGa4Props.map((prop) => {
                          const active = selectedGa4PropertyId === prop.name;
                          return (
                            <button
                              key={prop.name}
                              type="button"
                              onClick={() => setSelectedGa4PropertyId(prop.name)}
                              style={{
                                textAlign: 'left',
                                padding: '0.95rem 1rem',
                                borderRadius: '10px',
                                border: active ? '1px solid #00F0FF' : '1px solid rgba(255,255,255,0.09)',
                                background: active ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.02)',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                                {prop.displayName || prop.name}
                              </div>
                              <div style={{ color: '#9CA3AF', fontSize: '0.76rem', fontFamily: 'monospace' }}>
                                {prop.name}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'transparent',
                      color: '#D1D5DB',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600
                    }}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="btn-deploy-bulk"
                    style={{ marginTop: 0, padding: '0.75rem 1.5rem' }}
                  >
                    Next: Connect Google Tag Manager <ChevronRight size={17} style={{ marginLeft: '0.35rem' }} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ==================== STEP 3 ==================== */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h2 style={{ margin: '0 0 0.4rem', color: 'white', fontSize: '1.35rem' }}>
                  3. Connect Google Tag Manager (GTM)
                </h2>
                <p style={{ margin: '0 0 1.5rem', color: '#9CA3AF', fontSize: '0.9rem' }}>
                  Bind a GTM Account, Container, and Workspace to <strong>{projectName}</strong> for 1-click recipe deployment and workspace audits.
                </p>

                {!localGoogleConnected ? (
                  <div
                    style={{
                      padding: '1.5rem',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      color: '#FCD34D',
                      fontSize: '0.9rem',
                      marginBottom: '1.25rem'
                    }}
                  >
                    Google account is not connected yet. Connect Google in Step 2 or click below to authorize now.
                    <div style={{ marginTop: '0.85rem' }}>
                      <button type="button" onClick={handleConnectGoogle} className="btn-deploy-bulk" style={{ marginTop: 0 }}>
                        {isSandboxMode ? 'Connect Sample Google Account (Local)' : 'Authorize Google Account'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: '1.15rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                        GTM Account
                      </label>
                      <select
                        value={selectedGtmAccountId}
                        onChange={(e) => setSelectedGtmAccountId(e.target.value)}
                        className="module-input"
                        style={{ width: '100%' }}
                        disabled={loadingGtm}
                      >
                        <option value="">Select GTM Account...</option>
                        {gtmAccounts.map((acc) => (
                          <option key={acc.accountId} value={acc.accountId}>
                            {acc.name} ({acc.accountId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                        GTM Container
                      </label>
                      <select
                        value={selectedGtmContainerId}
                        onChange={(e) => setSelectedGtmContainerId(e.target.value)}
                        className="module-input"
                        style={{ width: '100%' }}
                        disabled={!selectedGtmAccountId || loadingGtm}
                      >
                        <option value="">Select Container...</option>
                        {gtmContainers.map((c) => (
                          <option key={c.containerId} value={c.containerId}>
                            {c.name} ({c.publicId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                        GTM Workspace
                      </label>
                      <select
                        value={selectedGtmWorkspaceId}
                        onChange={(e) => setSelectedGtmWorkspaceId(e.target.value)}
                        className="module-input"
                        style={{ width: '100%' }}
                        disabled={!selectedGtmContainerId || loadingGtm}
                      >
                        <option value="">
                          {loadingGtm
                            ? 'Loading Workspaces...'
                            : !selectedGtmContainerId
                            ? 'Select Container first...'
                            : 'Select Workspace...'}
                        </option>
                        {gtmWorkspaces.map((w) => (
                          <option key={w.workspaceId} value={w.workspaceId}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.45rem' }}>
                        GA4 Measurement ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="G-XXXXXXXXXX"
                        value={measurementId}
                        onChange={(e) => setMeasurementId(e.target.value)}
                        className="module-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'transparent',
                      color: '#D1D5DB',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600
                    }}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="btn-deploy-bulk"
                    style={{ marginTop: 0, padding: '0.75rem 1.5rem' }}
                  >
                    Next: Configure Triggers &amp; Rules <ChevronRight size={17} style={{ marginLeft: '0.35rem' }} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ==================== STEP 4 ==================== */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h2 style={{ margin: '0 0 0.4rem', color: 'white', fontSize: '1.35rem' }}>
                  4. Create Triggers, Rules &amp; Finish Configuration
                </h2>
                <p style={{ margin: '0 0 1.25rem', color: '#9CA3AF', fontSize: '0.9rem' }}>
                  Choose starter GA4 Observer anomaly rules tailored for{' '}
                  <strong style={{ color: selectedTypeMeta.color }}>{selectedTypeMeta.label}</strong> or define a custom rule.
                </p>

                {/* Rule mode tabs */}
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  {[
                    { id: 'templates' as const, label: 'Starter Templates (Recommended)' },
                    { id: 'custom' as const, label: 'Custom Rule Builder' },
                    { id: 'skip' as const, label: 'Configure Later Inside Project' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRuleMode(tab.id)}
                      style={{
                        padding: '0.55rem 0.95rem',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: ruleMode === tab.id ? '1px solid #00F0FF' : '1px solid rgba(255,255,255,0.1)',
                        background: ruleMode === tab.id ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                        color: ruleMode === tab.id ? '#00F0FF' : '#9CA3AF'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {!selectedGa4PropertyId && ruleMode !== 'skip' && (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#FCD34D',
                      fontSize: '0.84rem',
                      marginBottom: '1rem'
                    }}
                  >
                    Note: Select a GA4 Property in Step 2 to activate these rules immediately on creation. Without one, the project will still be created cleanly.
                  </div>
                )}

                {ruleMode === 'templates' && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
                      gap: '0.8rem',
                      maxHeight: '270px',
                      overflowY: 'auto',
                      marginBottom: '1.25rem'
                    }}
                  >
                    {sortedTemplates.slice(0, 9).map((tpl) => {
                      const picked = selectedTemplateIds.includes(tpl.id);
                      const isIndustryMatch = tpl.websiteType === websiteType;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => toggleTemplateSelection(tpl.id)}
                          style={{
                            textAlign: 'left',
                            padding: '0.9rem',
                            borderRadius: '10px',
                            border: picked ? '1px solid #00F0FF' : '1px solid rgba(255,255,255,0.08)',
                            background: picked ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'white' }}>
                              {tpl.icon} {tpl.name}
                            </span>
                            {isIndustryMatch && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  color: selectedTypeMeta.color,
                                  background: `${selectedTypeMeta.color}1F`,
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '9999px'
                                }}
                              >
                                Match
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#9CA3AF', fontSize: '0.76rem', lineHeight: 1.4, marginBottom: '0.45rem' }}>
                            {tpl.description}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {tpl.conditions.slice(0, 2).map((c, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.68rem',
                                  background: 'rgba(255,255,255,0.06)',
                                  color: '#D1D5DB',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px'
                                }}
                              >
                                {c.metric}: {formatConditionRuleBadge(c)}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {ruleMode === 'custom' && (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      marginBottom: '1.25rem'
                    }}
                  >
                    <div style={{ marginBottom: '0.85rem' }}>
                      <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Comparison Window
                      </label>
                      <select
                        value={customPeriod}
                        onChange={(e) => setCustomPeriod(e.target.value)}
                        className="module-input"
                        style={{ maxWidth: '420px', width: '100%' }}
                      >
                        {COMPARISON_PERIODS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {customRules.map((rule, idx) => (
                      <div
                        key={rule.id}
                        className="onboarding-rule-row"
                      >
                        <select
                          value={rule.metric}
                          onChange={(e) =>
                            setCustomRules((prev) =>
                              prev.map((r) => (r.id === rule.id ? { ...r, metric: e.target.value } : r))
                            )
                          }
                          className="module-input"
                        >
                          {GA4_METRICS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={rule.conditionType}
                          onChange={(e) =>
                            setCustomRules((prev) =>
                              prev.map((r) =>
                                r.id === rule.id ? { ...r, conditionType: e.target.value as ConditionOperator } : r
                              )
                            )
                          }
                          className="module-input"
                        >
                          <option value="drops_below">Drops by %</option>
                          <option value="spikes_above">Spikes by %</option>
                          <option value="changes_by">Changes by ±%</option>
                          <option value="equals_zero">Equals 0 (Outage)</option>
                          <option value="falls_under_value">Falls Under Value</option>
                          <option value="exceeds_value">Exceeds Value</option>
                        </select>
                        <input
                          type="number"
                          value={rule.thresholdPercentage}
                          disabled={rule.conditionType === 'equals_zero'}
                          onChange={(e) =>
                            setCustomRules((prev) =>
                              prev.map((r) =>
                                r.id === rule.id
                                  ? { ...r, thresholdPercentage: parseFloat(e.target.value) || 0 }
                                  : r
                              )
                            )
                          }
                          className="module-input"
                        />
                        {idx > 0 ? (
                          <button
                            type="button"
                            onClick={() => setCustomRules((prev) => prev.filter((r) => r.id !== rule.id))}
                            style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.4rem' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span />
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddCustomRule}
                      style={{
                        background: 'rgba(0, 240, 255, 0.08)',
                        color: '#00F0FF',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        marginTop: '0.25rem'
                      }}
                    >
                      <Plus size={14} /> Add Condition
                    </button>
                  </div>
                )}

                {ruleMode !== 'skip' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 205px), 1fr))', gap: '0.9rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#E5E7EB', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        <Clock size={14} color="#00F0FF" /> Alert Schedule Time &amp; Freq
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="module-input"
                          style={{ flex: '1 1 120px', minWidth: 0 }}
                        />
                        <select
                          value={scheduleFrequency}
                          onChange={(e) => setScheduleFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                          className="module-input"
                          style={{ flex: '1 1 120px', minWidth: 0 }}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Timezone
                      </label>
                      <select
                        value={scheduleTimezone}
                        onChange={(e) => setScheduleTimezone(e.target.value)}
                        className="module-input"
                        style={{ width: '100%' }}
                      >
                        {timezoneOptions.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#E5E7EB', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Alert Email Recipient(s)
                      </label>
                      <input
                        type="text"
                        placeholder="team@company.com, client@brand.com"
                        value={alertEmails}
                        onChange={(e) => setAlertEmails(e.target.value)}
                        className="module-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}

                {/* Final Configuration Summary */}
                <div
                  style={{
                    padding: '1rem 1.15rem',
                    borderRadius: '10px',
                    background: 'rgba(0, 240, 255, 0.04)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    marginBottom: '1.5rem',
                    fontSize: '0.84rem'
                  }}
                >
                  <div style={{ color: '#00F0FF', fontWeight: 700, fontSize: '0.76rem', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    PROJECT CONFIGURATION REVIEW
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: '0.6rem', color: '#E5E7EB' }}>
                    <div>
                      <span style={{ color: '#9CA3AF' }}>Project: </span>
                      <strong>{projectName}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#9CA3AF' }}>Type: </span>
                      <strong>{selectedTypeMeta.badge}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#9CA3AF' }}>GA4 Property: </span>
                      <strong>{selectedGa4Obj?.displayName || 'Not linked yet'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#9CA3AF' }}>GTM Container: </span>
                      <strong>{selectedGtmContainerObj ? `${selectedGtmContainerObj.publicId} (${selectedGtmWorkspaceObj?.name || 'Workspace'})` : 'Not linked yet'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={submitting}
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'transparent',
                      color: '#D1D5DB',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: 600
                    }}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateProject}
                    disabled={submitting}
                    className="btn-deploy-bulk"
                    style={{ marginTop: 0, padding: '0.8rem 1.75rem' }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} style={{ marginRight: '0.45rem' }} />
                        Creating Project Workspace...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} style={{ marginRight: '0.45rem' }} />
                        Create Project &amp; Go to Organization
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button
            type="button"
            onClick={() => navigate('/organization')}
            style={{ background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ExternalLink size={14} /> Return to Organization Dashboard
          </button>
        </div>
      </div>
    </PageTransition>
  );
};
