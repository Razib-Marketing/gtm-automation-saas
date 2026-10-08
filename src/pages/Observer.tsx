import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  ShieldAlert, Plus, Activity, Mail, Trash2, Home, LogOut, Pencil, Bell, 
  Send, X, Sparkles, Layers, Check, CheckCircle2, AlertTriangle, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Dashboard.css';

interface ConditionItem {
  id: string;
  metric: string;
  source?: string;
  medium?: string;
  customSource?: string;
  conditionType: 'drops_below' | 'spikes_above' | 'changes_by';
  thresholdPercentage: number;
}

interface IncidentTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  matchType: 'ALL' | 'ANY';
  period: string;
  conditions: Array<{
    metric: string;
    source: string;
    medium: string;
    conditionType: 'drops_below' | 'spikes_above' | 'changes_by';
    thresholdPercentage: number;
  }>;
}

interface TestReportResult {
  isOpen: boolean;
  status: 'success' | 'anomaly' | 'error';
  propertyName?: string;
  comparisonPeriod?: string;
  matchType?: 'ALL' | 'ANY';
  conditions?: Array<{
    metric: string;
    source?: string;
    medium?: string;
    conditionType: string;
    thresholdPercentage: number;
    pastVal: number;
    currentVal: number;
    percentChange: number;
    isTriggered: boolean;
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

const INCIDENT_TEMPLATES: IncidentTemplate[] = [
  {
    id: 'ecommerce_crash',
    name: 'E-Commerce Revenue & Sales Crash',
    icon: '🛒',
    category: 'E-Commerce & Revenue',
    description: 'Instant alert if transactions, key events, or revenue crash while visitors continue (broken checkout/payment gateway).',
    matchType: 'ANY',
    period: 'yesterday_vs_last_week',
    conditions: [
      { metric: 'keyEvents', source: 'all', medium: '', conditionType: 'drops_below', thresholdPercentage: 30 },
      { metric: 'totalRevenue', source: 'all', medium: '', conditionType: 'drops_below', thresholdPercentage: 35 },
      { metric: 'sessions', source: 'all', medium: '', conditionType: 'drops_below', thresholdPercentage: 25 }
    ]
  },
  {
    id: 'bot_surge',
    name: 'Bot Traffic & Scraper Surge',
    icon: '🤖',
    category: 'Traffic Integrity',
    description: 'Surge in automated traffic coupled with plunging engagement rate (headless browser scrapers or fake referral click farms).',
    matchType: 'ALL',
    period: 'yesterday_vs_last_week',
    conditions: [
      { metric: 'sessions', source: 'all', medium: '', conditionType: 'spikes_above', thresholdPercentage: 50 },
      { metric: 'engagementRate', source: 'all', medium: '', conditionType: 'drops_below', thresholdPercentage: 30 }
    ]
  },
  {
    id: 'outage_zero',
    name: 'Catastrophic Outage / Zero Tracking',
    icon: '🚨',
    category: 'Critical Emergency',
    description: 'Critical emergency alert if sessions or active users plunge drastically (site down, DNS error, or removed GTM script).',
    matchType: 'ANY',
    period: 'daily',
    conditions: [
      { metric: 'sessions', source: 'all', medium: '', conditionType: 'drops_below', thresholdPercentage: 40 },
      { metric: 'activeUsers', source: 'all', medium: '', conditionType: 'drops_below', thresholdPercentage: 40 }
    ]
  },
  {
    id: 'seo_organic_drop',
    name: 'Organic Search (SEO) Traffic Drop',
    icon: '📉',
    category: 'SEO & Search',
    description: 'Alert if Google Organic Search visitors drop (detects Google algorithm penalties, deindexing, or broken canonicals).',
    matchType: 'ANY',
    period: 'last_7_vs_previous_7',
    conditions: [
      { metric: 'sessions', source: 'Organic Search', medium: '', conditionType: 'drops_below', thresholdPercentage: 25 },
      { metric: 'keyEvents', source: 'Organic Search', medium: '', conditionType: 'drops_below', thresholdPercentage: 25 }
    ]
  },
  {
    id: 'paid_cpc_slump',
    name: 'Paid Search (CPC) Campaign Slump',
    icon: '💸',
    category: 'Paid Acquisition (PPC)',
    description: 'Drop in Paid Search or Paid Social traffic/conversions while Google Ads/Meta budget is actively spending.',
    matchType: 'ANY',
    period: 'last_7_vs_previous_7',
    conditions: [
      { metric: 'sessions', source: 'Paid Search', medium: 'cpc', conditionType: 'drops_below', thresholdPercentage: 25 },
      { metric: 'keyEvents', source: 'Paid Search', medium: 'cpc', conditionType: 'drops_below', thresholdPercentage: 25 }
    ]
  },
  {
    id: 'form_failure',
    name: 'Lead Gen & Booking Form Glitch',
    icon: '🎯',
    category: 'Lead Generation',
    description: 'Traffic stays steady, but Key Events (lead form submits/bookings) freeze or decline sharply (broken web form or API).',
    matchType: 'ANY',
    period: 'yesterday_vs_last_week',
    conditions: [
      { metric: 'keyEvents', source: 'all', medium: '', conditionType: 'drops_below', thresholdPercentage: 35 }
    ]
  },
  {
    id: 'ux_bounce_spike',
    name: 'High Bounce Rate & UX Glitch',
    icon: '📱',
    category: 'User Experience',
    description: 'Abnormal surge in bounce rate and plunge in engagement (500 server errors, slow mobile rendering, broken layout).',
    matchType: 'ANY',
    period: 'yesterday_vs_last_week',
    conditions: [
      { metric: 'bounceRate', source: 'all', medium: '', conditionType: 'spikes_above', thresholdPercentage: 35 },
      { metric: 'engagementRate', source: 'all', medium: '', conditionType: 'drops_below', thresholdPercentage: 30 }
    ]
  },
  {
    id: 'viral_surge',
    name: 'Viral Traffic Spike / Media Surge',
    icon: '📈',
    category: 'Growth Opportunity',
    description: 'Massive unexpected increase in sessions and new users (influencer feature, viral social mention, PR spotlight).',
    matchType: 'ANY',
    period: 'daily',
    conditions: [
      { metric: 'sessions', source: 'all', medium: '', conditionType: 'spikes_above', thresholdPercentage: 75 },
      { metric: 'newUsers', source: 'all', medium: '', conditionType: 'spikes_above', thresholdPercentage: 75 }
    ]
  }
];

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
    { id: '1', metric: 'sessions', source: 'all', medium: '', conditionType: 'drops_below', thresholdPercentage: 20 }
  ]);
  const [matchType, setMatchType] = useState<'ANY' | 'ALL'>('ANY');
  const [actionType, setActionType] = useState('email');
  const [period, setPeriod] = useState('yesterday_vs_last_week');
  const [alertEmails, setAlertEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [setupMode, setSetupMode] = useState<'template' | 'manual'>('manual');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestReportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [domainInfo, setDomainInfo] = useState<any>(null);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [showDnsGuide, setShowDnsGuide] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
    fetchDomainInfo();
  }, []);

  const fetchDomainInfo = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/resend/domain', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDomainInfo(data);
      }
    } catch (_) {}
  };

  const handleVerifyDomain = async () => {
    setVerifyingDomain(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/resend/domain', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domainId: domainInfo?.domain?.id || '6aab0c94-6a3b-44db-975a-c008300fbda3' })
      });
      if (res.ok) {
        const data = await res.json();
        setDomainInfo(data);
        if (data.isVerified) {
          alert('🎉 Domain verified successfully! All external team members will now receive incident emails.');
        } else {
          alert('DNS propagation in progress. Hostinger/DNS changes typically take 5–30 minutes to propagate. Please verify that all 4 DNS records are saved in your DNS settings.');
        }
      }
    } catch (e: any) {
      alert('Domain verification check failed: ' + e.message);
    } finally {
      setVerifyingDomain(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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

  const applyTemplate = (tmpl: IncidentTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setMatchType(tmpl.matchType);
    if (tmpl.period) setPeriod(tmpl.period);
    setConditions(tmpl.conditions.map((c, i) => ({
      id: String(Date.now() + i),
      metric: c.metric,
      source: c.source,
      medium: c.medium,
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
    setConditions(conditions.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

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
          alertEmail: finalEmails.join(', '),
          alertEmails: finalEmails,
          matchType,
          conditions: conditions.map(c => {
            const finalSource = c.source === 'custom' ? (c.customSource?.trim() || 'all') : (c.source || 'all');
            const finalMedium = c.medium?.trim() ? c.medium.trim() : 'all';
            return {
              metric: c.metric,
              source: finalSource,
              medium: finalMedium,
              conditionType: c.conditionType,
              thresholdPercentage: parseFloat(String(c.thresholdPercentage))
            };
          })
        })
      });
      
      if (res.ok) {
        setEditingId(null);
        setSelectedTemplateId(null);
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
    setPeriod(m.comparison_period);
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

        return {
          id: String(idx + 1),
          metric: c.metric,
          source,
          medium,
          customSource,
          conditionType: c.conditionType || c.condition_type || 'drops_below',
          thresholdPercentage: Math.abs(c.thresholdPercentage ?? c.threshold_percentage ?? 20)
        };
      }));
    } else {
      setConditions([{
        id: '1',
        metric: m.metric || 'sessions',
        source: 'all',
        medium: '',
        conditionType: m.condition_type || 'drops_below',
        thresholdPercentage: Math.abs(m.threshold_percentage || 20)
      }]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedProperty('');
    setConditions([{ id: '1', metric: 'sessions', source: 'all', medium: '', conditionType: 'drops_below', thresholdPercentage: 20 }]);
    setMatchType('ANY');
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
            <Link to="/" className="btn-home-link">
              <Home size={14} /> Home
            </Link>
            <button onClick={() => signOut()} className="btn-home-link" style={{ cursor: 'pointer' }}>
              <LogOut size={14} /> Log out
            </button>
          </div>
        </motion.div>

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
                  <Activity size={18} style={{ color: '#00F0FF' }}/> Trigger
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Evaluation Schedule</label>
                    <select className="module-input" style={{ paddingLeft: '1rem', opacity: 0.7 }} disabled>
                      <option>Daily at 8:00 AM (UTC)</option>
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
                      <option value="yesterday_vs_last_week">Yesterday vs Same Day Last Week (Recommended)</option>
                      <option value="last_7_vs_previous_7">Last 7 Days vs Previous 7 Days</option>
                      <option value="last_28_vs_previous_28">Last 28 Days vs Previous 28 Days</option>
                      <option value="last_30_vs_previous_30">Last 30 Days vs Previous 30 Days</option>
                      <option value="daily">Previous Day (Yesterday vs 2 Days Ago)</option>
                      <option value="weekly">Previous Week (Same Day)</option>
                      <option value="monthly">Previous Month (Last 30 Days)</option>
                      <option value="yearly">Previous Year</option>
                    </select>
                  </div>
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

                {/* Premade Templates Library Grid */}
                {setupMode === 'template' && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <label className="module-label" style={{ margin: 0, color: '#D1D5DB' }}>
                        ⚡ Select a Premade Incident Template (Click to Auto-Configure):
                      </label>
                      {selectedTemplateId && (
                        <span style={{ fontSize: '0.75rem', color: '#00F0FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Check size={14} /> Active Template Loaded
                        </span>
                      )}
                    </div>
                    <div className="template-card-grid">
                      {INCIDENT_TEMPLATES.map(tmpl => {
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
                                <span style={{ 
                                  fontSize: '0.68rem', 
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
                                    {c.metric} {c.conditionType === 'spikes_above' ? '>' : '< -'}{c.thresholdPercentage}%
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
                          ? 'All template rules loaded! You can adjust any threshold percentage, change filters, or add rules below.' 
                          : 'Define your custom metrics, condition thresholds, and acquisition segments.'}
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
                          <span><strong>Match ALL conditions (AND)</strong> — Alert <em>only if all conditions</em> happen together (e.g. Bot traffic spike)</span>
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

                    {conditions.map((c, index) => (
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
                              padding: '0.65rem 0.85rem', 
                              height: '44px', 
                              fontSize: '0.875rem', 
                              lineHeight: '1.4', 
                              boxSizing: 'border-box' 
                            }}
                          >
                            <option value="sessions">Sessions</option>
                            <option value="activeUsers">Active Users</option>
                            <option value="keyEvents">Key Events (Conversions)</option>
                            <option value="totalRevenue">Total Revenue</option>
                            <option value="newUsers">New Users</option>
                            <option value="eventCount">Event Count</option>
                            <option value="bounceRate">Bounce Rate</option>
                            <option value="engagementRate">Engagement Rate</option>
                          </select>
                        </div>

                        <div>
                          <label className="module-label" style={{ fontSize: '0.75rem', marginBottom: '0.35rem', display: 'block' }}>
                            Source
                          </label>
                          <select
                            value={c.source || 'all'}
                            onChange={e => updateCondition(c.id, 'source', e.target.value)}
                            className="module-input"
                            style={{ 
                              padding: '0.65rem 0.85rem', 
                              height: '44px', 
                              fontSize: '0.875rem', 
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
                              placeholder="e.g. reddit, newsletter"
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
                            Medium (Custom)
                          </label>
                          <input
                            type="text"
                            value={c.medium || ''}
                            onChange={e => updateCondition(c.id, 'medium', e.target.value)}
                            placeholder="e.g. cpc, organic, email (optional)"
                            className="module-input"
                            style={{ 
                              padding: '0.65rem 0.85rem', 
                              height: '44px', 
                              fontSize: '0.875rem', 
                              lineHeight: '1.4', 
                              boxSizing: 'border-box' 
                            }}
                          />
                        </div>

                        <div>
                          <label className="module-label" style={{ fontSize: '0.75rem', marginBottom: '0.35rem', display: 'block' }}>Operator</label>
                          <select
                            value={c.conditionType}
                            onChange={e => updateCondition(c.id, 'conditionType', e.target.value as any)}
                            className="module-input"
                            style={{ 
                              padding: '0.65rem 0.85rem', 
                              height: '44px', 
                              fontSize: '0.875rem', 
                              lineHeight: '1.4', 
                              boxSizing: 'border-box' 
                            }}
                          >
                            <option value="drops_below">Drops below</option>
                            <option value="spikes_above">Spikes above</option>
                            <option value="changes_by">Changes by (±)</option>
                          </select>
                        </div>

                        <div>
                          <label className="module-label" style={{ fontSize: '0.75rem', marginBottom: '0.35rem', display: 'block' }}>Threshold (%)</label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              type="number"
                              value={c.thresholdPercentage}
                              onChange={e => updateCondition(c.id, 'thresholdPercentage', e.target.value)}
                              className="module-input"
                              style={{ 
                                padding: '0.65rem 2rem 0.65rem 0.85rem', 
                                height: '44px', 
                                fontSize: '0.875rem', 
                                lineHeight: '1.4', 
                                boxSizing: 'border-box' 
                              }}
                              placeholder="20"
                              required
                            />
                            <span style={{ 
                              position: 'absolute', 
                              right: '0.75rem', 
                              top: '50%', 
                              transform: 'translateY(-50%)', 
                              color: '#6B7280', 
                              fontSize: '0.85rem', 
                              pointerEvents: 'none' 
                            }}>%</span>
                          </div>
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
                    ))}
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
                    <p style={{ margin: '0.45rem 0 0 0', fontSize: '0.75rem', color: '#6B7280' }}>
                      ⚡ Automatic alerts are sent to all recipients whenever an anomaly or incident occurs.
                    </p>

                    {/* Domain Verification Notice for External Recipients */}
                    <div className="domain-alert-banner">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Info size={15} style={{ color: domainInfo?.isVerified ? '#34D399' : '#F59E0B', flexShrink: 0 }} />
                        <span>
                          {domainInfo?.isVerified ? (
                            <><strong>Domain Verified:</strong> Alerts will be sent from <code>alerts@razibmarketing.net</code> to all recipients.</>
                          ) : (
                            <>External emails require <strong>razibmarketing.net</strong> DNS verification. (<code>ovi@razibmarketing.net</code> receives alerts now).</>
                          )}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setShowDnsGuide(!showDnsGuide)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          borderRadius: '6px',
                          padding: '0.25rem 0.6rem',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {showDnsGuide ? 'Hide DNS Records' : 'View DNS Records'}
                      </button>
                    </div>

                    {showDnsGuide && (
                      <div className="dns-guide-card" style={{ marginTop: '0.75rem' }}>
                        <div className="dns-guide-header">
                          <ShieldAlert size={18} style={{ color: '#F59E0B', flexShrink: 0 }} />
                          <div>
                            <h5 style={{ margin: 0, color: '#FCD34D', fontSize: '0.825rem', fontWeight: 700 }}>
                              Add 4 DNS Records for razibmarketing.net
                            </h5>
                            <p style={{ margin: '0.2rem 0 0', color: '#9CA3AF', fontSize: '0.75rem' }}>
                              Add these records to your domain DNS (e.g. Hostinger) to allow sending alerts to all team members and clients:
                            </p>
                          </div>
                        </div>

                        <div className="dns-records-container">
                          <table className="dns-table">
                            <thead>
                              <tr>
                                <th>Type</th>
                                <th>Host / Name</th>
                                <th>Value</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td><span className="dns-type-tag">TXT</span></td>
                                <td><code>resend._domainkey</code></td>
                                <td><span className="dns-val-text">p=MIGfMA0GCSqGSIb...</span></td>
                                <td>
                                  <button 
                                    type="button" 
                                    onClick={() => copyToClipboard('p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDrcbz86EIqmeoAEU0p5L6ntc7LOKeyQg7FcJEltqkQYI2VAhh8lhqT1+xJE6+/6fgy5cXHJEnPP8+ymz//Z2DjwRyBGGLsln96jy9iMWbn63V+Huocoat2YMxEMO7NlfAFcJoamRmo+o2cgGT/Eouvkst/ilUfxbKeIut4L9Q60QIDAQAB', 'dkim_form')}
                                    className="btn-copy-dns"
                                  >
                                    {copiedKey === 'dkim_form' ? '✓ Copied' : 'Copy'}
                                  </button>
                                </td>
                              </tr>
                              <tr>
                                <td><span className="dns-type-tag">MX</span></td>
                                <td><code>send</code></td>
                                <td><span className="dns-val-text">feedback-smtp.us-east-1.amazonses.com (Priority 10)</span></td>
                                <td>
                                  <button 
                                    type="button" 
                                    onClick={() => copyToClipboard('feedback-smtp.us-east-1.amazonses.com', 'mx_form')}
                                    className="btn-copy-dns"
                                  >
                                    {copiedKey === 'mx_form' ? '✓ Copied' : 'Copy'}
                                  </button>
                                </td>
                              </tr>
                              <tr>
                                <td><span className="dns-type-tag">TXT</span></td>
                                <td><code>send</code></td>
                                <td><span className="dns-val-text">v=spf1 include:amazonses.com ~all</span></td>
                                <td>
                                  <button 
                                    type="button" 
                                    onClick={() => copyToClipboard('v=spf1 include:amazonses.com ~all', 'spf_form')}
                                    className="btn-copy-dns"
                                  >
                                    {copiedKey === 'spf_form' ? '✓ Copied' : 'Copy'}
                                  </button>
                                </td>
                              </tr>
                              <tr>
                                <td><span className="dns-type-tag">CNAME</span></td>
                                <td><code>rsend</code></td>
                                <td><span className="dns-val-text">send.forge.rmta.net</span></td>
                                <td>
                                  <button 
                                    type="button" 
                                    onClick={() => copyToClipboard('send.forge.rmta.net', 'cname_form')}
                                    className="btn-copy-dns"
                                  >
                                    {copiedKey === 'cname_form' ? '✓ Copied' : 'Copy'}
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                          <button 
                            type="button"
                            onClick={handleVerifyDomain} 
                            disabled={verifyingDomain} 
                            className="btn-verify-domain"
                          >
                            {verifyingDomain ? 'Checking DNS...' : 'Verify DNS Propagation Now'}
                          </button>
                        </div>
                      </div>
                    )}
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
                            <span style={{ color: '#6B7280', fontSize: '0.75rem' }}>({m.comparison_period?.replace(/_/g, ' ')})</span>
                          </div>

                          {/* Render Compound Condition Badges */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                            {condList.map((c: any, cIdx: number) => {
                              const op = c.conditionType === 'spikes_above' ? 'Spikes >' : c.conditionType === 'changes_by' ? 'Changes ±' : 'Drops < -';
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
                                      if (!hasSource && !hasMedium) return null;
                                      const segText = (hasSource && hasMedium)
                                        ? `${c.source} / ${c.medium}`
                                        : hasSource
                                        ? c.source
                                        : `Medium: ${c.medium}`;
                                      return (
                                        <span style={{ 
                                          color: '#A5B4FC', 
                                          fontSize: '0.7rem',
                                          background: 'rgba(99, 102, 241, 0.18)',
                                          border: '1px solid rgba(99, 102, 241, 0.3)',
                                          padding: '1px 5px',
                                          borderRadius: '4px'
                                        }}>
                                          {segText}
                                        </span>
                                      );
                                    })()}
                                    <span>{op} {Math.abs(c.thresholdPercentage || c.threshold_percentage || 0)}%</span>
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

          {/* Recent Alerts Dashboard (Bottom) */}
          <div className="selection-card" style={{ marginTop: '1rem' }}>
            <div className="selection-header">
              <h3 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Bell size={20} style={{ color: '#F59E0B' }}/> Alert History
              </h3>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                  <div className="spinner">Loading...</div>
                </div>
              ) : alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9CA3AF' }}>
                  <Bell size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                  <p>No alerts have been triggered yet.</p>
                </div>
              ) : (
                <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {alerts.map((a: any) => (
                    <div 
                      key={a.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '1rem', 
                        background: 'rgba(255,255,255,0.02)',
                        borderLeft: '4px solid #EF4444',
                        borderRadius: '0 8px 8px 0'
                      }}
                    >
                      <div>
                        <h5 style={{ margin: '0 0 0.25rem 0', color: 'white', fontSize: '0.9rem' }}>{a.property_name}</h5>
                        <div style={{ display: 'flex', gap: '1rem', color: '#9CA3AF', fontSize: '0.8rem' }}>
                          <span>{a.metric}</span>
                          <span>{a.condition_type === 'spikes_above' ? 'Spiked by' : a.condition_type === 'changes_by' ? 'Changed by' : 'Dropped by'} {Math.abs(a.percent_change).toFixed(1)}%</span>
                        </div>
                      </div>
                      <div style={{ color: '#6B7280', fontSize: '0.8rem' }}>
                        {new Date(a.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
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

                      {/* Prominent explanation when sandbox blocks external recipients */}
                      {(testResult.sandboxRestricted || (testResult.failedRecipients && testResult.failedRecipients.length > 0)) && (
                        <div className="dns-guide-card" style={{ marginTop: '0.5rem' }}>
                          <div className="dns-guide-header">
                            <ShieldAlert size={18} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <h5 style={{ margin: '0 0 0.25rem', color: '#FCD34D', fontSize: '0.825rem', fontWeight: 700 }}>
                                Why did other emails not receive the report?
                              </h5>
                              <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.75rem', lineHeight: 1.45 }}>
                                Resend's test address (<code>onboarding@resend.dev</code>) only permits sending to the account owner (<strong>ovi@razibmarketing.net</strong>). To send to other team members or clients, add these 4 DNS records for <strong>razibmarketing.net</strong> to your DNS provider (Hostinger / DNS):
                              </p>
                            </div>
                          </div>

                          <div className="dns-records-container">
                            <table className="dns-table">
                              <thead>
                                <tr>
                                  <th>Type</th>
                                  <th>Host / Name</th>
                                  <th>Value</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td><span className="dns-type-tag">TXT</span></td>
                                  <td><code>resend._domainkey</code></td>
                                  <td><span className="dns-val-text">p=MIGfMA0GCSqGSIb...</span></td>
                                  <td>
                                    <button 
                                      type="button" 
                                      onClick={() => copyToClipboard('p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDrcbz86EIqmeoAEU0p5L6ntc7LOKeyQg7FcJEltqkQYI2VAhh8lhqT1+xJE6+/6fgy5cXHJEnPP8+ymz//Z2DjwRyBGGLsln96jy9iMWbn63V+Huocoat2YMxEMO7NlfAFcJoamRmo+o2cgGT/Eouvkst/ilUfxbKeIut4L9Q60QIDAQAB', 'dkim_modal')}
                                      className="btn-copy-dns"
                                    >
                                      {copiedKey === 'dkim_modal' ? '✓ Copied' : 'Copy'}
                                    </button>
                                  </td>
                                </tr>
                                <tr>
                                  <td><span className="dns-type-tag">MX</span></td>
                                  <td><code>send</code></td>
                                  <td><span className="dns-val-text">feedback-smtp.us-east-1.amazonses.com (Priority 10)</span></td>
                                  <td>
                                    <button 
                                      type="button" 
                                      onClick={() => copyToClipboard('feedback-smtp.us-east-1.amazonses.com', 'mx_modal')}
                                      className="btn-copy-dns"
                                    >
                                      {copiedKey === 'mx_modal' ? '✓ Copied' : 'Copy'}
                                    </button>
                                  </td>
                                </tr>
                                <tr>
                                  <td><span className="dns-type-tag">TXT</span></td>
                                  <td><code>send</code></td>
                                  <td><span className="dns-val-text">v=spf1 include:amazonses.com ~all</span></td>
                                  <td>
                                    <button 
                                      type="button" 
                                      onClick={() => copyToClipboard('v=spf1 include:amazonses.com ~all', 'spf_modal')}
                                      className="btn-copy-dns"
                                    >
                                      {copiedKey === 'spf_modal' ? '✓ Copied' : 'Copy'}
                                    </button>
                                  </td>
                                </tr>
                                <tr>
                                  <td><span className="dns-type-tag">CNAME</span></td>
                                  <td><code>rsend</code></td>
                                  <td><span className="dns-val-text">send.forge.rmta.net</span></td>
                                  <td>
                                    <button 
                                      type="button" 
                                      onClick={() => copyToClipboard('send.forge.rmta.net', 'cname_modal')}
                                      className="btn-copy-dns"
                                    >
                                      {copiedKey === 'cname_modal' ? '✓ Copied' : 'Copy'}
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                            <button 
                              type="button"
                              onClick={handleVerifyDomain} 
                              disabled={verifyingDomain} 
                              className="btn-verify-domain"
                            >
                              {verifyingDomain ? 'Checking DNS...' : 'Verify DNS Propagation Now'}
                            </button>
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
                            const op = c.conditionType === 'spikes_above' ? '>' : c.conditionType === 'changes_by' ? '±' : '< -';
                            const hasSource = c.source && c.source !== 'All' && c.source !== 'all';
                            const hasMedium = c.medium && c.medium !== 'All' && c.medium !== 'all';

                            return (
                              <div key={i} className={`test-report-cond-item ${c.isTriggered ? 'triggered' : 'passed'}`}>
                                <div className="cond-item-left">
                                  <div className="cond-item-title-row">
                                    <span className="cond-metric-name">{c.metric}</span>
                                    {(hasSource || hasMedium) && (
                                      <span className="cond-segment-tag">
                                        {hasSource && hasMedium ? `${c.source} / ${c.medium}` : (hasSource ? c.source : c.medium)}
                                      </span>
                                    )}
                                    <span className="cond-rule-tag">
                                      Rule: {op} {Math.abs(c.thresholdPercentage)}%
                                    </span>
                                  </div>

                                  <div className="cond-telemetry-row">
                                    <span className="cond-val-pill">Prev: <strong>{c.pastVal.toLocaleString()}</strong></span>
                                    <span style={{ color: '#6B7280' }}>→</span>
                                    <span className="cond-val-pill">Curr: <strong>{c.currentVal.toLocaleString()}</strong></span>
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
