import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
  ShieldAlert, Plus, Activity, Mail, Trash2, Home, LogOut, Pencil, Bell,
  Send, X, Sparkles, Layers, Check, CheckCircle2, AlertTriangle, Info, Zap, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { pushDataLayer } from '../utils/analytics';
import {
  INCIDENT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  COMPARISON_PERIODS,
  GA4_METRICS,
  getTimezoneOptions,
  getBrowserTimezone,
  formatPeriodLabel,
  getThresholdUnitSuffix,
  formatConditionRuleBadge
} from '../data/observerTemplates';
import type { IncidentTemplate, ConditionOperator, DeviceCategory } from '../data/observerTemplates';
import './Dashboard.css';

interface ConditionItem {
  id: string;
  metric: string;
  source?: string;
  medium?: string;
  device?: DeviceCategory;
  customSource?: string;
  conditionType: ConditionOperator;
  thresholdPercentage: number;
}

interface TestReportResult {
  isOpen: boolean;
  status: 'success' | 'anomaly' | 'error';
  propertyName?: string;
  comparisonPeriod?: string;
  dateRangeSummary?: {
    label: string;
    current: { startDate: string; endDate: string };
    previous: { startDate: string; endDate: string };
  };
  schedule?: {
    time: string;
    timezone: string;
    frequency: string;
  };
  matchType?: 'ALL' | 'ANY';
  conditions?: Array<{
    metric: string;
    source?: string;
    medium?: string;
    device?: string;
    conditionType: string;
    thresholdPercentage: number;
    pastVal: number;
    currentVal: number;
    formattedPast?: string;
    formattedCurrent?: string;
    percentChange: number;
    isTriggered: boolean;
    operatorLabel?: string;
  }>;
  emailStatus?: string;
  emailError?: string | null;
  recipients?: string[];
  successfulRecipients?: string[];
  failedRecipients?: Array<{ email: string; reason: string }>;
  sandboxRestricted?: boolean;
  verifiedDomainName?: string | null;
  errorMessage?: string;
}

const KNOWN_SOURCES = [
  'all',
  'Direct',
  'Cross-network',
  'Organic Search',
  'Paid Search',
  'Organic Social',
  'Paid Social',
  'Referral',
  'Email',
  'Affiliates',
  'Display',
  'Unassigned',
  'google',
  'direct',
  'facebook',
  'instagram',
  'tiktok',
  'youtube',
  'linkedin',
  'bing',
  'twitter'
];

export const Observer = () => {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const [properties, setProperties] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedProperty, setSelectedProperty] = useState('');
  const [conditions, setConditions] = useState<ConditionItem[]>([
    { id: '1', metric: 'sessions', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 20 }
  ]);
  const [matchType, setMatchType] = useState<'ANY' | 'ALL'>('ANY');
  const [actionType, setActionType] = useState('email');
  const [period, setPeriod] = useState('yesterday_vs_last_week');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [scheduleTimezone, setScheduleTimezone] = useState(() => getBrowserTimezone());
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [accountScheduleTime, setAccountScheduleTime] = useState('08:00');
  const [accountScheduleTimezone, setAccountScheduleTimezone] = useState('UTC');
  const [applyToExistingMonitors, setApplyToExistingMonitors] = useState(false);
  const [savingAccountSchedule, setSavingAccountSchedule] = useState(false);
  const [accountScheduleSaved, setAccountScheduleSaved] = useState(false);
  const [websiteType, setWebsiteType] = useState('general');

  const [alertEmails, setAlertEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [setupMode, setSetupMode] = useState<'template' | 'manual'>('manual');
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<string>('All');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestReportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [alertHistoryTab, setAlertHistoryTab] = useState<'automated' | 'manual'>('automated');
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'custom'>('pro');
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTestResult(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    fetchProperties();
    fetchMonitors();
    if (user?.id) {
      const email = user.primaryEmailAddress?.emailAddress || '';
      fetch(`/api/user/me?clerkUserId=${user.id}&email=${encodeURIComponent(email)}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.subscription_tier) {
            setUserTier(data.subscription_tier);
          }
          if (data?.schedule_time) {
            setAccountScheduleTime(data.schedule_time);
            setScheduleTime(data.schedule_time);
          }
          if (data?.schedule_timezone) {
            setAccountScheduleTimezone(data.schedule_timezone);
            setScheduleTimezone(data.schedule_timezone);
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  const fetchProperties = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/ga4/properties', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProperties(data.properties || []);
      } else {
        setErrorMsg(data.error || 'Failed to fetch properties');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const fetchMonitors = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/ga4/monitors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMonitors(data.monitors || []);
        if (data.alerts) setAlerts(data.alerts);
        if (data.accountSchedule) {
          if (data.accountSchedule.time) setAccountScheduleTime(data.accountSchedule.time);
          if (data.accountSchedule.timezone) setAccountScheduleTimezone(data.accountSchedule.timezone);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress && alertEmails.length === 0) {
      setAlertEmails([user.primaryEmailAddress.emailAddress]);
    }
  }, [user]);

  const addEmail = (raw: string) => {
    const cleaned = raw.trim();
    if (!cleaned) return;
    const parts = cleaned.split(/[,;\s]+/).map(s => s.trim()).filter(s => s.includes('@'));
    if (parts.length === 0) return;
    setAlertEmails(prev => {
      const set = new Set([...prev, ...parts]);
      return Array.from(set);
    });
    setEmailInput('');
  };

  const removeEmail = (emailToRemove: string) => {
    setAlertEmails(prev => prev.filter(e => e !== emailToRemove));
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      addEmail(emailInput);
    }
  };

  const handleEmailBlur = () => {
    if (emailInput.trim() && emailInput.includes('@')) {
      addEmail(emailInput);
    }
  };

  const saveAccountSchedule = async () => {
    setSavingAccountSchedule(true);
    setAccountScheduleSaved(false);
    setErrorMsg('');
    try {
      const token = await getToken();
      const res = await fetch('/api/user/me', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduleTime,
          scheduleTimezone,
          applyToExistingMonitors,
          email: user?.primaryEmailAddress?.emailAddress || ''
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAccountScheduleTime(data.schedule_time || scheduleTime);
        setAccountScheduleTimezone(data.schedule_timezone || scheduleTimezone);
        setAccountScheduleSaved(true);
        if (applyToExistingMonitors) {
          await fetchMonitors();
        }
        setTimeout(() => setAccountScheduleSaved(false), 3500);
      } else {
        setErrorMsg(data.error || 'Failed to save account default schedule');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to save account schedule');
    } finally {
      setSavingAccountSchedule(false);
    }
  };

  const applyTemplate = (tmpl: IncidentTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setWebsiteType(tmpl.websiteType || 'general');
    setMatchType(tmpl.matchType);
    if (tmpl.period) setPeriod(tmpl.period);
    setConditions(tmpl.conditions.map((c, i) => ({
      id: String(Date.now() + i),
      metric: c.metric,
      source: c.source,
      medium: c.medium,
      device: c.device || 'all',
      conditionType: c.conditionType,
      thresholdPercentage: c.thresholdPercentage
    })));
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: String(Date.now()),
        metric: 'keyEvents',
        source: 'all',
        medium: '',
        device: 'all',
        conditionType: 'drops_below',
        thresholdPercentage: 20
      }
    ]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length <= 1) return;
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, field: keyof ConditionItem, value: any) => {
    setConditions(conditions.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };
      if (field === 'conditionType' && value === 'equals_zero') {
        updated.thresholdPercentage = 0;
      }
      return updated;
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (userTier === 'free') {
      alert("A paid subscription (Pro or Custom) is required to create autonomous GA4 anomaly monitors. Please choose a plan on our pricing page.");
      window.location.href = '/pricing';
      return;
    }

    let finalEmails = [...alertEmails];
    if (emailInput.trim() && emailInput.includes('@')) {
      finalEmails = Array.from(new Set([...finalEmails, emailInput.trim()]));
      setAlertEmails(finalEmails);
      setEmailInput('');
    }

    if (finalEmails.length === 0) {
      setErrorMsg('Please specify at least one alert email recipient.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/ga4/monitors', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingId,
          propertyId: selectedProperty,
          propertyName: properties.find(p => p.name === selectedProperty)?.displayName,
          comparisonPeriod: period,
          scheduleTime,
          scheduleTimezone,
          scheduleFrequency,
          websiteType,
          alertEmail: finalEmails.join(', '),
          alertEmails: finalEmails,
          matchType,
          conditions: conditions.map(c => {
            const finalSource = c.source === 'custom' ? (c.customSource?.trim() || 'all') : (c.source || 'all');
            const finalMedium = c.medium?.trim() ? c.medium.trim() : 'all';
            const finalDevice = c.device || 'all';
            const parsedThresh = c.conditionType === 'equals_zero' ? 0 : parseFloat(String(c.thresholdPercentage || 0));
            return {
              metric: c.metric,
              source: finalSource,
              medium: finalMedium,
              device: finalDevice,
              conditionType: c.conditionType,
              thresholdPercentage: Number.isFinite(parsedThresh) ? parsedThresh : 0
            };
          })
        })
      });

      if (res.ok) {
        setEditingId(null);
        setSelectedTemplateId(null);
        setWebsiteType('general');
        await fetchMonitors();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to save monitor');
      }
    } catch (e) {
      setErrorMsg('An error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    const monitorObj = monitors.find(m => m.id === id);
    try {
      const res = await fetch('/api/ga4/test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ monitorId: id })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        pushDataLayer('ga4_test_dispatched', {
          monitor_id: id,
          property_name: data.propertyName || monitorObj?.property_name,
          is_triggered: data.isTriggered
        });

        const recipientsList = (data.recipients && data.recipients.length > 0)
          ? data.recipients
          : (monitorObj?.alert_email
              ? monitorObj.alert_email.split(/[,;\s]+/).map((e: string) => e.trim()).filter((e: string) => e.includes('@'))
              : []);

        setTestResult({
          isOpen: true,
          status: data.isTriggered ? 'anomaly' : 'success',
          propertyName: data.propertyName || monitorObj?.property_name || 'GA4 Observer Monitor',
          comparisonPeriod: data.comparisonPeriod || monitorObj?.comparison_period || 'yesterday_vs_last_week',
          dateRangeSummary: data.dateRangeSummary,
          schedule: data.schedule,
          matchType: data.matchType || monitorObj?.match_type || 'ANY',
          conditions: data.conditions || [],
          emailStatus: data.emailStatus || 'Sent',
          emailError: data.emailError,
          recipients: recipientsList,
          successfulRecipients: data.successfulRecipients || (recipientsList.length > 0 ? [recipientsList[0]] : []),
          failedRecipients: data.failedRecipients || [],
          sandboxRestricted: Boolean(data.sandboxRestricted),
          verifiedDomainName: data.verifiedDomainName || null,
        });
        await fetchMonitors();
      } else {
        setTestResult({
          isOpen: true,
          status: 'error',
          errorMessage: data?.error || `Server returned error status ${res.status}`
        });
      }
    } catch (e: any) {
      setTestResult({
        isOpen: true,
        status: 'error',
        errorMessage: e.message || 'An unexpected network error occurred while running the test.'
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setSelectedProperty(m.property_id);
    setPeriod(m.comparison_period || 'yesterday_vs_last_week');
    setScheduleTime(m.scheduleTime || m.schedule_time || accountScheduleTime || '08:00');
    setScheduleTimezone(m.scheduleTimezone || m.schedule_timezone || accountScheduleTimezone || getBrowserTimezone());
    const freq = (m.scheduleFrequency || m.schedule_frequency || 'daily').toLowerCase();
    setScheduleFrequency(['daily', 'weekly', 'monthly'].includes(freq) ? (freq as 'daily' | 'weekly' | 'monthly') : 'daily');
    setWebsiteType(m.websiteType || m.website_type || 'general');

    const parsed = m.alert_email
      ? m.alert_email.split(/[,;\s]+/).map((e: string) => e.trim()).filter((e: string) => e.includes('@'))
      : [];
    setAlertEmails(parsed);
    setEmailInput('');
    setSelectedTemplateId(null);
    setSetupMode('manual');
    setMatchType(m.matchType || m.match_type || 'ANY');
    if (m.conditions && Array.isArray(m.conditions) && m.conditions.length > 0) {
      setConditions(m.conditions.map((c: any, idx: number) => {
        const rawSource = c.source || 'all';
        const isKnownSource = KNOWN_SOURCES.includes(rawSource);
        const source = isKnownSource ? rawSource : (rawSource === 'all' ? 'all' : 'custom');
        const customSource = isKnownSource ? '' : (rawSource === 'all' ? '' : rawSource);

        const medium = (c.medium && c.medium !== 'all') ? c.medium : '';
        const device: DeviceCategory = (['desktop', 'mobile', 'tablet'].includes((c.device || '').toLowerCase())
          ? c.device.toLowerCase()
          : 'all') as DeviceCategory;
        const cType: ConditionOperator = (c.conditionType || c.condition_type || 'drops_below') as ConditionOperator;
        const rawVal = Number(c.thresholdPercentage ?? c.threshold_percentage ?? 20);
        const thresh = (cType === 'falls_under_value' || cType === 'exceeds_value')
          ? rawVal
          : cType === 'equals_zero'
            ? 0
            : Math.abs(rawVal);

        return {
          id: String(idx + 1),
          metric: c.metric,
          source,
          medium,
          device,
          customSource,
          conditionType: cType,
          thresholdPercentage: thresh
        };
      }));
    } else {
      setConditions([{
        id: '1',
        metric: m.metric || 'sessions',
        source: 'all',
        medium: '',
        device: 'all',
        conditionType: (m.condition_type || 'drops_below') as ConditionOperator,
        thresholdPercentage: Math.abs(m.threshold_percentage || 20)
      }]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedProperty('');
    setConditions([{ id: '1', metric: 'sessions', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 20 }]);
    setMatchType('ANY');
    setScheduleTime(accountScheduleTime || '08:00');
    setScheduleTimezone(accountScheduleTimezone || getBrowserTimezone());
    setScheduleFrequency('daily');
    setWebsiteType('general');
    setAlertEmails(user?.primaryEmailAddress?.emailAddress ? [user.primaryEmailAddress.emailAddress] : []);
    setEmailInput('');
    setSelectedTemplateId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this monitor?')) return;
    try {
      const token = await getToken();
      await fetch(`/api/ga4/monitors?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchMonitors();
    } catch (e) {
      console.error(e);
    }
  };

  const automatedAlerts = alerts.filter((a: any) => (a.alert_type || 'automated') === 'automated');
  const manualReports = alerts.filter((a: any) => a.alert_type === 'manual');

  return (
    <PageTransition locationKey="observer">
      <BackgroundMesh />
      <div className="dashboard-container">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}
        >
          <div>
            <h1 className="dashboard-title" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Activity className="w-8 h-8 text-blue-400" />
              Observer
            </h1>
            <p className="dashboard-subtitle">Automated GA4 Anomaly Detection & Monitoring</p>
          </div>
          <div className="topbar-actions">
            <a href="https://gtmobserver.com" className="btn-home-link" style={{ textDecoration: 'none' }}>
              <Home size={14} /> Home
            </a>
            <button onClick={() => signOut()} className="btn-home-link" style={{ cursor: 'pointer' }}>
              <LogOut size={14} /> Log out
            </button>
          </div>
        </motion.div>

        {userTier === 'free' && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.15) 0%, rgba(0, 240, 255, 0.15) 100%)',
            border: '1px solid rgba(0, 240, 255, 0.35)',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 4px 20px rgba(0, 240, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ background: 'rgba(0, 240, 255, 0.15)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                <Sparkles size={22} color="#00F0FF" />
              </div>
              <div>
                <p style={{ margin: 0, color: '#FFFFFF', fontWeight: 700, fontSize: '1rem' }}>
                  Subscription Required to Activate Monitors
                </p>
                <p style={{ margin: '0.25rem 0 0 0', color: '#9CA3AF', fontSize: '0.875rem' }}>
                  Please purchase a plan to create autonomous 24/7 GA4 anomaly monitors and receive multi-email incident alerts.
                </p>
              </div>
            </div>
            <Link to="/pricing" style={{
              background: 'linear-gradient(135deg, #00F0FF 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              padding: '0.65rem 1.4rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 12px rgba(0, 240, 255, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              Choose a Plan &rarr;
            </Link>
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="dashboard-content"
          style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}
        >
          {/* Create Monitor Form */}
          <div className="selection-card">
            <div className="selection-header">
              <h3 className="section-title" style={{ margin: 0 }}>Create New Monitor</h3>
            </div>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1.5rem' }}>
              
              {/* TRIGGER SECTION */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ color: 'white', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} style={{ color: '#00F0FF' }}/> Trigger & Evaluation Schedule
                </h4>

                <div className="schedule-controls-grid">
                  <div>
                    <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Evaluation Frequency</label>
                    <select
                      value={scheduleFrequency}
                      onChange={e => setScheduleFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                      className="module-input"
                      style={{ paddingLeft: '1rem' }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly (Mondays)</option>
                      <option value="monthly">Monthly (1st of Month)</option>
                    </select>
                  </div>

                  <div>
                    <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Evaluation Time</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      className="module-input"
                      style={{ paddingLeft: '1rem', paddingRight: '0.85rem', colorScheme: 'dark' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Timezone</label>
                    <select
                      value={scheduleTimezone}
                      onChange={e => setScheduleTimezone(e.target.value)}
                      className="module-input"
                      style={{ paddingLeft: '1rem' }}
                    >
                      {getTimezoneOptions(scheduleTimezone).map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Comparison Period</label>
                    <select
                      value={period}
                      onChange={e => setPeriod(e.target.value)}
                      className="module-input"
                      style={{ paddingLeft: '1rem' }}
                    >
                      {(['Daily & Short-Term', 'Week over Week (WoW)', 'Month over Month (MoM)', 'Year over Year (YoY)'] as const).map(grp => (
                        <optgroup key={grp} label={grp}>
                          {COMPARISON_PERIODS.filter(p => p.group === grp).map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Account-wide Default Schedule Save Bar */}
                <div className="schedule-account-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#CBD5E1' }}>
                    <Clock size={15} style={{ color: '#00F0FF', flexShrink: 0 }} />
                    <span>
                      Account default: <strong style={{ color: '#FFFFFF' }}>{accountScheduleTime}</strong> ({accountScheduleTimezone})
                    </span>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem', cursor: 'pointer', color: '#9CA3AF', fontSize: '0.78rem' }}>
                      <input
                        type="checkbox"
                        checked={applyToExistingMonitors}
                        onChange={e => setApplyToExistingMonitors(e.target.checked)}
                        style={{ accentColor: '#00F0FF' }}
                      />
                      Apply to all existing monitors
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={saveAccountSchedule}
                    disabled={savingAccountSchedule}
                    style={{
                      padding: '0.45rem 0.95rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 240, 255, 0.35)',
                      background: accountScheduleSaved ? 'rgba(16, 185, 129, 0.16)' : 'rgba(0, 240, 255, 0.12)',
                      color: accountScheduleSaved ? '#34D399' : '#00F0FF',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: savingAccountSchedule ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {accountScheduleSaved ? (
                      <>
                        <Check size={14} /> Saved as Account Default
                      </>
                    ) : savingAccountSchedule ? (
                      'Saving...'
                    ) : (
                      <>
                        <Clock size={13} /> Save as my account default time
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* CONDITION SECTION */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ color: 'white', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={18} style={{ color: '#F59E0B' }}/> Condition & Anomaly Rules
                </h4>

                {/* GA4 Property Selection */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>GA4 Property</label>
                  <select
                    value={selectedProperty}
                    onChange={e => setSelectedProperty(e.target.value)}
                    className="module-input"
                    style={{ paddingLeft: '1rem' }}
                    required
                  >
                    <option value="">Select a property...</option>
                    {properties.map(p => (
                      <option key={p.name} value={p.name}>{p.displayName} ({p.name})</option>
                    ))}
                  </select>
                  {errorMsg && <div style={{ color: '#EF4444', marginTop: '0.5rem', fontSize: '0.875rem' }}>{errorMsg}</div>}
                </div>

                {/* Setup Mode Selector */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="module-label" style={{ display: 'block', marginBottom: '0.6rem', color: '#9CA3AF' }}>
                    Setup Method (1-Click Template vs Manual Builder):
                  </label>
                  <div className="template-mode-nav">
                    <button
                      type="button"
                      onClick={() => { setSetupMode('manual'); setSelectedTemplateId(null); }}
                      className={`template-mode-btn ${setupMode === 'manual' ? 'active' : ''}`}
                    >
                      <Layers size={15} style={{ color: setupMode === 'manual' ? '#00F0FF' : 'inherit' }} />
                      Custom Rules (Manual Builder)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSetupMode('template')}
                      className={`template-mode-btn ${setupMode === 'template' ? 'active' : ''}`}
                    >
                      <Sparkles size={15} style={{ color: setupMode === 'template' ? '#00F0FF' : 'inherit' }} />
                      Premade Templates ({INCIDENT_TEMPLATES.length})
                    </button>
                  </div>
                </div>

                {/* Premade Templates Library Grid with Category Filter Tabs */}
                {setupMode === 'template' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <label className="module-label" style={{ margin: 0, color: '#D1D5DB' }}>
                        ⚡ Select a Website Perspective Template (Click to Auto-Configure):
                      </label>
                      {selectedTemplateId && (
                        <span style={{ fontSize: '0.75rem', color: '#00F0FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Check size={14} /> Active Template Loaded
                        </span>
                      )}
                    </div>

                    {/* Interactive Category Tabs */}
                    <div className="template-category-tabs">
                      {TEMPLATE_CATEGORIES.map(cat => {
                        const count = cat.id === 'All'
                          ? INCIDENT_TEMPLATES.length
                          : INCIDENT_TEMPLATES.filter(t => t.category === cat.id).length;
                        const isCatActive = activeTemplateCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveTemplateCategory(cat.id)}
                            className={`template-category-pill ${isCatActive ? 'active' : ''}`}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: '9999px',
                              background: isCatActive ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                              color: isCatActive ? '#FFFFFF' : '#9CA3AF'
                            }}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="template-card-grid">
                      {INCIDENT_TEMPLATES
                        .filter(tmpl => activeTemplateCategory === 'All' || tmpl.category === activeTemplateCategory)
                        .map(tmpl => {
                        const isSelected = selectedTemplateId === tmpl.id;
                        return (
                          <div
                            key={tmpl.id}
                            onClick={() => applyTemplate(tmpl)}
                            className={`template-item-card ${isSelected ? 'selected' : ''}`}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                <span style={{ fontSize: '1.35rem' }}>{tmpl.icon}</span>
                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                  <span style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 600,
                                    padding: '2px 7px',
                                    borderRadius: '9999px',
                                    background: 'rgba(139, 92, 246, 0.14)',
                                    color: '#C4B5FD',
                                    border: '1px solid rgba(139, 92, 246, 0.25)'
                                  }}>
                                    {formatPeriodLabel(tmpl.period)}
                                  </span>
                                  <span style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    background: isSelected ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    color: isSelected ? '#00F0FF' : '#9CA3AF',
                                    border: `1px solid ${isSelected ? '#00F0FF' : 'rgba(255, 255, 255, 0.08)'}`
                                  }}>
                                    {tmpl.category}
                                  </span>
                                </div>
                              </div>
                              <h5 style={{ margin: '0 0 0.35rem 0', color: 'white', fontSize: '0.88rem', fontWeight: 600 }}>
                                {tmpl.name}
                              </h5>
                              <p style={{ margin: 0, fontSize: '0.74rem', color: '#9CA3AF', lineHeight: '1.35' }}>
                                {tmpl.description}
                              </p>
                            </div>

                            <div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.65rem' }}>
                                {tmpl.conditions.map((c, i) => (
                                  <span key={i} style={{ fontSize: '0.68rem', padding: '1px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: '#E5E7EB' }}>
                                    {c.metric}
                                    {c.device && c.device !== 'all' ? ` [${c.device}]` : ''}{' '}
                                    {formatConditionRuleBadge(c)}
                                  </span>
                                ))}
                                <span style={{ fontSize: '0.68rem', padding: '1px 5px', background: 'rgba(99, 102, 241, 0.15)', color: '#A5B4FC', borderRadius: '4px', fontWeight: 600 }}>
                                  Match {tmpl.matchType}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); applyTemplate(tmpl); }}
                                style={{
                                  width: '100%',
                                  padding: '0.45rem',
                                  borderRadius: '6px',
                                  border: isSelected ? '1px solid #00F0FF' : '1px solid rgba(255, 255, 255, 0.1)',
                                  background: isSelected ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                  color: isSelected ? '#00F0FF' : '#D1D5DB',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.35rem',
                                  transition: 'all 0.15s'
                                }}
                              >
                                {isSelected ? <><Check size={13} /> Loaded & Active</> : 'Apply Template'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h5 style={{ margin: 0, color: 'white', fontSize: '0.92rem', fontWeight: 600 }}>
                        {selectedTemplateId ? '⚙ Customize Applied Template Rules' : '⚙ Active Anomaly Conditions'}
                      </h5>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>
                        {selectedTemplateId
                          ? 'All template rules loaded! You can adjust any threshold, change channel or device filters, or add rules below.'
                          : 'Define your custom metrics, condition thresholds, acquisition channels, and device perspective triggers.'}
                      </p>
                    </div>
                  </div>

                  {/* Compound Match Logic (Shown when multiple conditions exist) */}
                  {conditions.length > 1 && (
                    <div style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '1rem', borderRadius: '8px' }}>
                      <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem', color: '#E0E7FF' }}>
                        Rule Logic (Compound Conditions)
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#F3F4F6', fontSize: '0.875rem' }}>
                          <input
                            type="radio"
                            name="matchType"
                            value="ANY"
                            checked={matchType === 'ANY'}
                            onChange={() => setMatchType('ANY')}
                            style={{ accentColor: '#6366F1' }}
                          />
                          <span><strong>Match ANY condition (OR)</strong> — Alert if <em>any condition</em> triggers</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#F3F4F6', fontSize: '0.875rem' }}>
                          <input
                            type="radio"
                            name="matchType"
                            value="ALL"
                            checked={matchType === 'ALL'}
                            onChange={() => setMatchType('ALL')}
                            style={{ accentColor: '#6366F1' }}
                          />
                          <span><strong>Match ALL conditions (AND)</strong> — Alert <em>only if all conditions</em> happen together (e.g. Cross-domain leak or Bot spike)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Conditions List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="module-label" style={{ margin: 0 }}>
                        Conditions ({conditions.length})
                      </label>
                      <button
                        type="button"
                        onClick={addCondition}
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#A5B4FC',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Plus size={14} /> Add Condition
                      </button>
                    </div>

                    {conditions.map((c, index) => {
                      const unitSuffix = getThresholdUnitSuffix(c.conditionType, c.metric);
                      const isZeroOp = c.conditionType === 'equals_zero';
                      const thresholdLabel = isZeroOp
                        ? 'Target Value'
                        : unitSuffix === '%'
                          ? 'Threshold (%)'
                          : `Threshold (${unitSuffix})`;

                      return (
                      <div
                        key={c.id}
                        className="condition-row-grid"
                      >
                        <div>
                          <label className="module-label" style={{ fontSize: '0.75rem', marginBottom: '0.35rem', display: 'block' }}>
                            {index > 0 ? (matchType === 'ALL' ? 'AND Metric' : 'OR Metric') : 'Metric'}
                          </label>
                          <select
                            value={c.metric}
                            onChange={e => updateCondition(c.id, 'metric', e.target.value)}
                            className="module-input"
                            style={{
                              padding: '0.65rem 0.75rem',
                              height: '44px',
                              fontSize: '0.85rem',
                              lineHeight: '1.4',
                              boxSizing: 'border-box'
                            }}
                          >
                            {(['Traffic & Engagement', 'Conversions & Revenue', 'Content & Events'] as const).map(grp => (
                              <optgroup key={grp} label={grp}>
                                {GA4_METRICS.filter(m => m.group === grp).map(m => (
                                  <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="module-label" style={{ fontSize: '0.75rem', marginBottom: '0.35rem', display: 'block' }}>
                            Source / Channel
                          </label>
                          <select
                            value={c.source || 'all'}
                            onChange={e => updateCondition(c.id, 'source', e.target.value)}
                            className="module-input"
                            style={{
                              padding: '0.65rem 0.75rem',
                              height: '44px',
                              fontSize: '0.85rem',
                              lineHeight: '1.4',
                              boxSizing: 'border-box'
                            }}
                          >
                            <option value="all">All Traffic (All Sources)</option>
                            <optgroup label="GA4 Channel Groups (Acquisition)">
                              <option value="Direct">Direct</option>
                              <option value="Cross-network">Cross-network</option>
                              <option value="Organic Search">Organic Search</option>
                              <option value="Paid Search">Paid Search</option>
                              <option value="Organic Social">Organic Social</option>
                              <option value="Paid Social">Paid Social</option>
                              <option value="Referral">Referral</option>
                              <option value="Email">Email</option>
                              <option value="Affiliates">Affiliates</option>
                              <option value="Display">Display</option>
                              <option value="Unassigned">Unassigned</option>
                            </optgroup>
                            <optgroup label="Popular Sources">
                              <option value="google">google</option>
                              <option value="direct">direct / (direct)</option>
                              <option value="facebook">facebook</option>
                              <option value="instagram">instagram</option>
                              <option value="tiktok">tiktok</option>
                              <option value="youtube">youtube</option>
                              <option value="linkedin">linkedin</option>
                              <option value="bing">bing</option>
                              <option value="twitter">twitter / x</option>
                            </optgroup>
                            <option value="custom">Custom Source...</option>
                          </select>
                          {c.source === 'custom' && (
                            <input
                              type="text"
                              value={c.customSource || ''}
                              onChange={e => updateCondition(c.id, 'customSource', e.target.value)}
                              placeholder="e.g. reddit, tripadvisor"
                              className="module-input"
                              style={{
                                marginTop: '0.4rem',
                                padding: '0.5rem 0.75rem',
                                height: '38px',
                                fontSize: '0.8rem',
                                boxSizing: 'border-box'
                              }}
                              required
                            />
                          )}
                        </div>

                        <div>
                          <label className="module-label" style={{ fontSize: '0.75rem', marginBottom: '0.35rem', display: 'block' }}>
                            Medium (Optional)
                          </label>
                          <input
                            type="text"
                            value={c.medium || ''}
                            onChange={e => updateCondition(c.id, 'medium', e.target.value)}
                            placeholder="cpc, organic..."
                            className="module-input"
                            style={{
                              padding: '0.65rem 0.75rem',
                              height: '44px',
                              fontSize: '0.85rem',
                              lineHeight: '1.4',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        <div>
                          <label className="module-label" style={{ fontSize: '0.75rem', marginBottom: '0.35rem', display: 'block' }}>
                            Device
                          </label>
                          <select
                            value={c.device || 'all'}
                            onChange={e => updateCondition(c.id, 'device', e.target.value as DeviceCategory)}
                            className="module-input"
                            style={{
                              padding: '0.65rem 0.75rem',
                              height: '44px',
                              fontSize: '0.85rem',
                              lineHeight: '1.4',
                              boxSizing: 'border-box'
                            }}
                          >
                            <option value="all">All Devices</option>
                            <option value="mobile">Mobile</option>
                            <option value="desktop">Desktop</option>
                            <option value="tablet">Tablet</option>
                          </select>
                        </div>

                        <div>
                          <label className="module-label" style={{ fontSize: '0.75rem', marginBottom: '0.35rem', display: 'block' }}>Trigger Type</label>
                          <select
                            value={c.conditionType}
                            onChange={e => updateCondition(c.id, 'conditionType', e.target.value as ConditionOperator)}
                            className="module-input"
                            style={{
                              padding: '0.65rem 0.75rem',
                              height: '44px',
                              fontSize: '0.85rem',
                              lineHeight: '1.4',
                              boxSizing: 'border-box'
                            }}
                          >
                            <optgroup label="Relative Change (%)">
                              <option value="drops_below">Drops below (%)</option>
                              <option value="spikes_above">Spikes above (%)</option>
                              <option value="changes_by">Changes by (±%)</option>
                            </optgroup>
                            <optgroup label="Website Perspective Triggers">
                              <option value="equals_zero">Drops to Zero (= 0 Outage)</option>
                              <option value="falls_under_value">Falls below value (&lt;)</option>
                              <option value="exceeds_value">Exceeds value (&gt;)</option>
                            </optgroup>
                          </select>
                        </div>

                        <div>
                          <label className="module-label" style={{ fontSize: '0.75rem', marginBottom: '0.35rem', display: 'block' }}>{thresholdLabel}</label>
                          {isZeroOp ? (
                            <div
                              style={{
                                height: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '0.5rem',
                                color: '#FCA5A5',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                boxSizing: 'border-box'
                              }}
                            >
                              = 0
                            </div>
                          ) : (
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="number"
                                step="any"
                                value={c.thresholdPercentage}
                                onChange={e => updateCondition(c.id, 'thresholdPercentage', e.target.value)}
                                className="module-input"
                                style={{
                                  padding: '0.65rem 2.3rem 0.65rem 0.75rem',
                                  height: '44px',
                                  fontSize: '0.85rem',
                                  lineHeight: '1.4',
                                  boxSizing: 'border-box'
                                }}
                                placeholder="20"
                                required
                              />
                              <span style={{
                                position: 'absolute',
                                right: '0.65rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#6B7280',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                pointerEvents: 'none'
                              }}>{unitSuffix}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <div style={{ height: '0.75rem', marginBottom: '0.35rem' }} />
                          <button
                            type="button"
                            onClick={() => removeCondition(c.id)}
                            disabled={conditions.length <= 1}
                            style={{
                              height: '44px',
                              width: '42px',
                              background: conditions.length <= 1 ? 'transparent' : 'rgba(239, 68, 68, 0.08)',
                              border: conditions.length <= 1 ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(239, 68, 68, 0.2)',
                              color: conditions.length <= 1 ? '#4B5563' : '#EF4444',
                              cursor: conditions.length <= 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              transition: 'all 0.2s'
                            }}
                            title={conditions.length <= 1 ? 'At least one condition required' : 'Remove condition'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ACTION SECTION */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ color: 'white', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={18} style={{ color: '#00F0FF' }}/> Action
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Action Type</label>
                    <select 
                      value={actionType}
                      onChange={e => setActionType(e.target.value)}
                      className="module-input" 
                      style={{ paddingLeft: '1rem' }}
                    >
                      <option value="email">Send Email Alert</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                      <label className="module-label" style={{ margin: 0 }}>
                        Alert Recipients ({alertEmails.length})
                      </label>
                      <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Press Enter or comma to add</span>
                    </div>

                    <div className="email-chips-container">
                      {alertEmails.map((email, idx) => (
                        <span key={idx} className="email-chip">
                          <Mail size={11} style={{ color: '#00F0FF', flexShrink: 0 }} />
                          <span>{email}</span>
                          <button 
                            type="button" 
                            onClick={() => removeEmail(email)}
                            className="email-chip-remove"
                            title="Remove recipient"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input 
                        type="email" 
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        onKeyDown={handleEmailKeyDown}
                        onBlur={handleEmailBlur}
                        placeholder={alertEmails.length === 0 ? "Type email and press Enter..." : "Add another email..."}
                        className="email-chips-input"
                      />
                      {emailInput.trim() && (
                        <button
                          type="button"
                          onClick={() => addEmail(emailInput)}
                          style={{
                            background: 'rgba(0, 240, 255, 0.15)',
                            border: '1px solid #00F0FF',
                            color: '#00F0FF',
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          + Add
                        </button>
                      )}
                    </div>
                    <div style={{ margin: '0.45rem 0 0 0', fontSize: '0.75rem', color: '#6B7280' }}>
                      ⚡ Automatic alerts are sent to all recipients whenever an anomaly or incident occurs.
                      {alertEmails.some((e: string) => e.toLowerCase() !== 'ovi@razibmarketing.net') && (
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.45rem 0.75rem',
                          background: 'rgba(0, 191, 165, 0.05)',
                          border: '1px solid rgba(0, 191, 165, 0.2)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          fontSize: '0.75rem',
                          color: '#9CA3AF'
                        }}>
                          <Info size={14} style={{ color: '#00BFA5', flexShrink: 0 }} />
                          <span>In testing mode, alerts deliver to <strong>ovi@razibmarketing.net</strong>. When your production domain is connected, all recipients will receive alerts automatically.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="submit" 
                  disabled={creating || !selectedProperty}
                  className="btn-deploy-bulk"
                  style={{ alignSelf: 'flex-start' }}
                >
                  {creating ? 'Saving...' : (
                    <>
                      {editingId ? <Pencil size={18} style={{ marginRight: '0.5rem' }} /> : <Plus size={18} style={{ marginRight: '0.5rem' }} />}
                      {editingId ? 'Update Monitor' : 'Add Monitor'}
                    </>
                  )}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={cancelEdit}
                    className="btn-deploy-bulk"
                    style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px solid #4B5563', color: '#D1D5DB' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

          </div>

          {/* Active Monitors */}
          <div className="selection-card">
            <div className="selection-header">
              <h3 className="section-title" style={{ margin: 0 }}>Active Monitors</h3>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                  <div className="spinner">Loading...</div>
                </div>
              ) : monitors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9CA3AF' }}>
                  <ShieldAlert size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <h4 style={{ color: 'white', fontSize: '1.125rem', marginBottom: '0.5rem' }}>No Monitors Active</h4>
                  <p>Create a monitor above to start tracking your GA4 properties.</p>
                </div>
              ) : (
                <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {monitors.map(m => {
                    const condList = m.conditions && Array.isArray(m.conditions) && m.conditions.length > 0
                      ? m.conditions
                      : [{ metric: m.metric, conditionType: m.condition_type, thresholdPercentage: m.threshold_percentage }];
                    const mType = m.matchType || m.match_type || 'ANY';

                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={m.id} 
                        className="module-card observer-monitor-card"
                      >
                        <div className="observer-card-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: m.status === 'active' ? '#00F0FF' : '#F59E0B' 
                            }} />
                            <h4 style={{ color: 'white', margin: 0, fontWeight: 600 }}>{m.property_name}</h4>
                            <span style={{
                              background: mType === 'ALL' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: mType === 'ALL' ? '#C084FC' : '#93C5FD',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              border: `1px solid ${mType === 'ALL' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                            }}>
                              Match {mType}
                            </span>
                            <span style={{
                              background: 'rgba(0, 240, 255, 0.1)',
                              color: '#67E8F9',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              border: '1px solid rgba(0, 240, 255, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}>
                              <Clock size={11} />
                              {(m.scheduleFrequency || m.schedule_frequency || 'daily').replace(/^\w/, (ch: string) => ch.toUpperCase())} • {m.scheduleTime || m.schedule_time || '08:00'} ({m.scheduleTimezone || m.schedule_timezone || 'UTC'})
                            </span>
                            <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>({formatPeriodLabel(m.comparison_period)})</span>
                          </div>

                          {/* Render Compound Condition Badges */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                            {condList.map((c: any, cIdx: number) => {
                              return (
                                <React.Fragment key={cIdx}>
                                  {cIdx > 0 && (
                                    <span style={{
                                      color: mType === 'ALL' ? '#C084FC' : '#60A5FA',
                                      fontWeight: 700,
                                      fontSize: '0.72rem',
                                      padding: '0 2px'
                                    }}>
                                      {mType === 'ALL' ? 'AND' : 'OR'}
                                    </span>
                                  )}
                                  <span style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: '#E5E7EB',
                                    fontSize: '0.78rem',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                  }}>
                                    <strong>{c.metric}</strong>
                                    {(() => {
                                      const hasSource = c.source && c.source !== 'all' && c.source !== 'All';
                                      const hasMedium = c.medium && c.medium !== 'all' && c.medium !== 'All';
                                      const hasDevice = c.device && c.device !== 'all' && c.device !== 'All';
                                      if (!hasSource && !hasMedium && !hasDevice) return null;
                                      const parts: string[] = [];
                                      if (hasSource && hasMedium) parts.push(`${c.source} / ${c.medium}`);
                                      else if (hasSource) parts.push(c.source);
                                      else if (hasMedium) parts.push(`Medium: ${c.medium}`);
                                      if (hasDevice) parts.push(c.device);
                                      return (
                                        <span style={{
                                          color: '#A5B4FC',
                                          fontSize: '0.7rem',
                                          background: 'rgba(99, 102, 241, 0.18)',
                                          border: '1px solid rgba(99, 102, 241, 0.3)',
                                          padding: '1px 5px',
                                          borderRadius: '4px'
                                        }}>
                                          {parts.join(' • ')}
                                        </span>
                                      );
                                    })()}
                                    <span>{formatConditionRuleBadge(c)}</span>
                                  </span>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="observer-card-actions">
                          {(() => {
                            const rawEmails = (m.alert_email || '').split(',').map((e: string) => e.trim()).filter(Boolean);
                            const count = rawEmails.length;
                            const label = count > 1 ? `${rawEmails[0]} (+${count - 1} more)` : (rawEmails[0] || 'No email');
                            return (
                              <div 
                                title={rawEmails.join(', ')}
                                style={{ 
                                  fontSize: '0.825rem', 
                                  color: '#9CA3AF', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  background: 'rgba(255,255,255,0.05)',
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '9999px',
                                  maxWidth: '260px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  cursor: count > 1 ? 'pointer' : 'default'
                                }}
                              >
                                <Mail size={13} style={{ marginRight: '0.4rem', flexShrink: 0, color: '#00F0FF' }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                              </div>
                            );
                          })()}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleTest(m.id)}
                              disabled={testingId === m.id}
                              className="btn-send-report"
                              title="Send report email and check metrics"
                            >
                              {testingId === m.id ? (
                                <>
                                  <Activity size={13} className="animate-spin" />
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <Send size={13} />
                                  <span>Send Report</span>
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => handleEdit(m)}
                              className="btn-icon-action edit"
                              title="Edit Monitor"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(m.id)}
                              className="btn-icon-action delete"
                              title="Delete Monitor"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dual-Type Alert History Dashboard (Bottom) */}
          <div className="selection-card" style={{ marginTop: '1rem' }}>
            <div className="selection-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Bell size={20} style={{ color: '#00F0FF' }}/> Alert History
              </h3>

              {/* Two Type History Switcher */}
              <div style={{
                display: 'flex',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '4px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <button
                  type="button"
                  onClick={() => setAlertHistoryTab('automated')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.785rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.15s ease',
                    border: alertHistoryTab === 'automated' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid transparent',
                    background: alertHistoryTab === 'automated' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: alertHistoryTab === 'automated' ? '#FCA5A5' : '#9CA3AF'
                  }}
                >
                  <Zap size={13} style={{ color: alertHistoryTab === 'automated' ? '#EF4444' : '#6B7280' }} />
                  <span>Automated Issue Alerts</span>
                  <span style={{
                    fontSize: '0.685rem',
                    background: alertHistoryTab === 'automated' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    color: alertHistoryTab === 'automated' ? '#FEE2E2' : '#9CA3AF'
                  }}>
                    {automatedAlerts.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAlertHistoryTab('manual')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.785rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.15s ease',
                    border: alertHistoryTab === 'manual' ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid transparent',
                    background: alertHistoryTab === 'manual' ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                    color: alertHistoryTab === 'manual' ? '#00F0FF' : '#9CA3AF'
                  }}
                >
                  <Send size={13} style={{ color: alertHistoryTab === 'manual' ? '#00F0FF' : '#6B7280' }} />
                  <span>Manual Report History</span>
                  <span style={{
                    fontSize: '0.685rem',
                    background: alertHistoryTab === 'manual' ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    color: alertHistoryTab === 'manual' ? '#FFFFFF' : '#9CA3AF'
                  }}>
                    {manualReports.length}
                  </span>
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: '1.25rem' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                  <div className="spinner">Loading history...</div>
                </div>
              ) : alertHistoryTab === 'automated' ? (
                automatedAlerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9CA3AF' }}>
                    <Zap size={44} style={{ margin: '0 auto 0.75rem', opacity: 0.25, color: '#EF4444' }} />
                    <h4 style={{ margin: '0 0 0.25rem', color: '#E5E7EB', fontSize: '0.95rem' }}>No Automated Issue Alerts Yet</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                      Automated monitoring runs daily in the background. When an anomaly triggers your monitor conditions, it will be automatically recorded here.
                    </p>
                  </div>
                ) : (
                  <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {automatedAlerts.map((a: any) => (
                      <div 
                        key={a.id} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '1rem', 
                          background: 'rgba(239, 68, 68, 0.03)',
                          border: '1px solid rgba(239, 68, 68, 0.15)',
                          borderLeft: '4px solid #EF4444',
                          borderRadius: '0 8px 8px 0',
                          gap: '1rem'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#F87171',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '0.685rem',
                              fontWeight: 700,
                              letterSpacing: '0.03em'
                            }}>
                              <Zap size={11} /> AUTOMATED ISSUE ALERT
                            </span>
                            <h5 style={{ margin: 0, color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 600 }}>
                              {a.property_name}
                            </h5>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', color: '#9CA3AF', fontSize: '0.785rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ color: '#E5E7EB', fontWeight: 500 }}>{a.metric}</span>
                            <span style={{ color: '#F87171', fontWeight: 600 }}>
                              {a.condition_type === 'equals_zero'
                                ? 'Dropped to zero'
                                : a.condition_type === 'falls_under_value'
                                  ? `Fell below threshold (${Math.abs(a.percent_change).toFixed(1)}% vs baseline)`
                                  : a.condition_type === 'exceeds_value'
                                    ? `Exceeded threshold (${Math.abs(a.percent_change).toFixed(1)}% vs baseline)`
                                    : `${a.condition_type === 'spikes_above' ? 'Spiked by' : a.condition_type === 'changes_by' ? 'Changed by' : 'Dropped by'} ${Math.abs(a.percent_change).toFixed(1)}%`}
                            </span>
                            {a.recipients && (
                              <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                • Sent to: {a.recipients}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ color: '#6B7280', fontSize: '0.75rem', whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {new Date(a.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                manualReports.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9CA3AF' }}>
                    <Send size={44} style={{ margin: '0 auto 0.75rem', opacity: 0.25, color: '#00F0FF' }} />
                    <h4 style={{ margin: '0 0 0.25rem', color: '#E5E7EB', fontSize: '0.95rem' }}>No Manual Reports Sent Yet</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                      Click <strong>"Send Report"</strong> on any active monitor above to dispatch an on-demand report to your team and log it here.
                    </p>
                  </div>
                ) : (
                  <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {manualReports.map((a: any) => {
                      const isStable = a.status === 'stable' || a.condition_type === 'stable';
                      const accentColor = isStable ? '#00F0FF' : '#EF4444';
                      const badgeBg = isStable ? 'rgba(0, 240, 255, 0.1)' : 'rgba(239, 68, 68, 0.15)';
                      const badgeBorder = isStable ? 'rgba(0, 240, 255, 0.3)' : 'rgba(239, 68, 68, 0.3)';
                      const badgeText = isStable ? '#00F0FF' : '#FCA5A5';
                      const badgeLabel = isStable ? 'HEALTH CHECK (STABLE)' : 'ANOMALY DETECTED';

                      return (
                        <div 
                          key={a.id} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '1rem', 
                            background: isStable ? 'rgba(0, 240, 255, 0.02)' : 'rgba(239, 68, 68, 0.03)',
                            border: `1px solid ${isStable ? 'rgba(0, 240, 255, 0.12)' : 'rgba(239, 68, 68, 0.15)'}`,
                            borderLeft: `4px solid ${accentColor}`,
                            borderRadius: '0 8px 8px 0',
                            gap: '1rem'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                background: badgeBg,
                                color: badgeText,
                                border: `1px solid ${badgeBorder}`,
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontSize: '0.685rem',
                                fontWeight: 700,
                                letterSpacing: '0.03em'
                              }}>
                                <Send size={11} /> {badgeLabel}
                              </span>
                              <h5 style={{ margin: 0, color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 600 }}>
                                {a.property_name}
                              </h5>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', color: '#9CA3AF', fontSize: '0.785rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ color: '#E5E7EB', fontWeight: 500 }}>{a.metric}</span>
                              {a.recipients && (
                                <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                                  • Delivered to: {a.recipients}
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={{ color: '#6B7280', fontSize: '0.75rem', whiteSpace: 'nowrap', textAlign: 'right' }}>
                            {new Date(a.created_at).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>

        </motion.div>
      </div>

      {/* Animated Cool Test Report Popup Modal */}
      <AnimatePresence>
        {testResult?.isOpen && (
          <motion.div 
            className="test-report-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTestResult(null)}
          >
            <motion.div 
              className="test-report-modal-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="test-report-modal-glow" />

              <button 
                className="test-report-modal-close"
                onClick={() => setTestResult(null)}
                title="Close"
              >
                <X size={18} />
              </button>

              {testResult.status === 'error' ? (
                <div className="test-report-modal-body">
                  <div className="test-report-error-view">
                    <div className="test-report-error-icon">
                      <ShieldAlert size={38} color="#EF4444" />
                    </div>
                    <h4 style={{ color: '#F87171', fontSize: '1.25rem', margin: '0 0 0.5rem', fontWeight: 700 }}>
                      Report Test Failed
                    </h4>
                    <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5, maxWidth: '420px' }}>
                      {testResult.errorMessage || 'An error occurred while evaluating metrics or contacting the email service.'}
                    </p>
                    <button 
                      onClick={() => setTestResult(null)} 
                      className="btn-modal-done"
                      style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="test-report-modal-body custom-scrollbar">
                    {/* Hero Header */}
                    <div className="test-report-hero">
                      <div className={`test-report-icon-ring ${testResult.status === 'anomaly' ? 'anomaly' : 'healthy'}`}>
                        <motion.div 
                          className="test-report-icon-inner"
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", damping: 14, stiffness: 260, delay: 0.1 }}
                        >
                          {testResult.status === 'anomaly' ? (
                            <AlertTriangle size={32} />
                          ) : (
                            <CheckCircle2 size={32} />
                          )}
                        </motion.div>
                      </div>

                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                      >
                        <div className={`test-report-status-badge ${testResult.status === 'anomaly' ? 'anomaly' : 'healthy'}`}>
                          {testResult.status === 'anomaly' ? '⚠️ ANOMALY DETECTED & ALERT DISPATCHED' : '✨ TEST REPORT DISPATCHED'}
                        </div>
                        <h3 className="test-report-title">
                          {testResult.propertyName || 'GA4 Observer Monitor'}
                        </h3>
                        <p className="test-report-subtitle">
                          {testResult.status === 'anomaly' 
                            ? 'Live telemetry breached your anomaly conditions. An incident alert email has been sent.' 
                            : 'All GA4 telemetry metrics evaluated healthy and within your normal baseline thresholds.'}
                        </p>
                      </motion.div>
                    </div>

                    {/* Email Delivery Box */}
                    <div className="test-report-delivery-card">
                      <div className="test-report-delivery-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Send size={14} style={{ color: '#00F0FF' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#F3F4F6' }}>Email Dispatch</span>
                        </div>
                        <div className="test-report-delivery-status">
                          <span className="live-dot" />
                          <span>{testResult.emailStatus || 'Sent via Resend'}</span>
                        </div>
                      </div>

                      <div className="test-report-recipients-wrap">
                        <span style={{ fontSize: '0.725rem', color: '#9CA3AF' }}>
                          Recipient Deliverability Breakdown:
                        </span>
                        <div className="test-report-recipients-list">
                          {(testResult.successfulRecipients && testResult.successfulRecipients.length > 0 
                            ? testResult.successfulRecipients 
                            : testResult.recipients || []).map((email, idx) => (
                            <span key={`succ-${idx}`} className="recipient-pill-delivered">
                              <Check size={12} />
                              <span>{email} (Delivered)</span>
                            </span>
                          ))}
                          {(testResult.failedRecipients || []).map((f, idx) => (
                            <span key={`fail-${idx}`} className="recipient-pill-blocked" title={f.reason}>
                              <AlertTriangle size={12} />
                              <span>{f.email} (Blocked by Sandbox)</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Delivery note when in testing sandbox mode */}
                      {(testResult.sandboxRestricted || (testResult.failedRecipients && testResult.failedRecipients.length > 0)) && (
                        <div style={{
                          marginTop: '0.75rem',
                          padding: '0.75rem 1rem',
                          background: 'rgba(0, 191, 165, 0.05)',
                          border: '1px solid rgba(0, 191, 165, 0.2)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.65rem'
                        }}>
                          <Info size={16} style={{ color: '#00BFA5', flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ fontSize: '0.775rem', lineHeight: 1.45, color: '#D1D5DB' }}>
                            <div style={{ fontWeight: 600, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                              Testing Mode Delivery Notice
                            </div>
                            <div style={{ color: '#9CA3AF' }}>
                              Report delivered to verified admin (<strong>ovi@razibmarketing.net</strong>).
                              {testResult.failedRecipients && testResult.failedRecipients.length > 0 && (
                                <span> Additional recipient(s) ({testResult.failedRecipients.map(f => f.email).join(', ')}) will automatically receive all alerts once your production domain is connected.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {testResult.emailError && !testResult.sandboxRestricted && (
                        <div className="test-report-advisory">
                          <Info size={14} style={{ flexShrink: 0, color: '#F59E0B' }} />
                          <span>{testResult.emailError}</span>
                        </div>
                      )}
                    </div>

                    {/* Evaluated Conditions */}
                    <div className="test-report-conditions-section">
                      {testResult.dateRangeSummary && (
                        <div style={{
                          marginBottom: '0.75rem',
                          padding: '0.6rem 0.85rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          color: '#CBD5E1',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.2rem'
                        }}>
                          <div>
                            <strong style={{ color: '#00F0FF' }}>{testResult.dateRangeSummary.label}</strong>
                          </div>
                          <div style={{ color: '#9CA3AF' }}>
                            Compared: <strong style={{ color: '#E5E7EB' }}>{testResult.dateRangeSummary.current.startDate} → {testResult.dateRangeSummary.current.endDate}</strong> vs{' '}
                            <strong style={{ color: '#E5E7EB' }}>{testResult.dateRangeSummary.previous.startDate} → {testResult.dateRangeSummary.previous.endDate}</strong>
                          </div>
                          {testResult.schedule && (
                            <div style={{ color: '#9CA3AF' }}>
                              Schedule: <strong style={{ color: '#E5E7EB' }}>{testResult.schedule.frequency}</strong> at <strong style={{ color: '#E5E7EB' }}>{testResult.schedule.time}</strong> ({testResult.schedule.timezone})
                            </div>
                          )}
                        </div>
                      )}

                      <div className="test-report-conditions-header">
                        <span style={{ fontWeight: 600, fontSize: '0.825rem', color: '#E5E7EB' }}>
                          Condition Evaluation ({testResult.conditions?.length || 0})
                        </span>
                        <span className="test-report-logic-tag">
                          {testResult.matchType === 'ALL' ? 'Rule: Match ALL (AND)' : 'Rule: Match ANY (OR)'}
                        </span>
                      </div>

                      <div className="test-report-conditions-list custom-scrollbar">
                        {testResult.conditions && testResult.conditions.length > 0 ? (
                          testResult.conditions.map((c, i) => {
                            const isNeg = c.percentChange < 0;
                            const hasSource = c.source && c.source !== 'All' && c.source !== 'all';
                            const hasMedium = c.medium && c.medium !== 'All' && c.medium !== 'all';
                            const hasDevice = c.device && c.device !== 'All' && c.device !== 'all';
                            const segParts: string[] = [];
                            if (hasSource && hasMedium) segParts.push(`${c.source} / ${c.medium}`);
                            else if (hasSource) segParts.push(c.source as string);
                            else if (hasMedium) segParts.push(`Medium: ${c.medium}`);
                            if (hasDevice) segParts.push(c.device as string);

                            return (
                              <div key={i} className={`test-report-cond-item ${c.isTriggered ? 'triggered' : 'passed'}`}>
                                <div className="cond-item-left">
                                  <div className="cond-item-title-row">
                                    <span className="cond-metric-name">{c.metric}</span>
                                    {segParts.length > 0 && (
                                      <span className="cond-segment-tag">
                                        {segParts.join(' • ')}
                                      </span>
                                    )}
                                    <span className="cond-rule-tag">
                                      Rule: {c.operatorLabel || formatConditionRuleBadge(c)}
                                    </span>
                                  </div>

                                  <div className="cond-telemetry-row">
                                    <span className="cond-val-pill">Prev: <strong>{c.formattedPast || c.pastVal.toLocaleString()}</strong></span>
                                    <span style={{ color: '#6B7280' }}>→</span>
                                    <span className="cond-val-pill">Curr: <strong>{c.formattedCurrent || c.currentVal.toLocaleString()}</strong></span>
                                  </div>
                                </div>

                                <div className="cond-item-right">
                                  <span className={`cond-change-badge ${isNeg ? 'negative' : 'positive'}`}>
                                    {c.percentChange > 0 ? '+' : ''}{c.percentChange.toFixed(1)}%
                                  </span>
                                  <span className={`cond-status-pill ${c.isTriggered ? 'alert' : 'ok'}`}>
                                    {c.isTriggered ? 'Triggered' : 'Healthy'}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: '#9CA3AF', textAlign: 'center', padding: '0.75rem' }}>
                            Single metric evaluation completed.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="test-report-modal-footer">
                    <button 
                      onClick={() => setTestResult(null)}
                      className="btn-modal-done"
                    >
                      Done & Dismiss
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};
