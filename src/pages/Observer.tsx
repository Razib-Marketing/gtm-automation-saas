import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ShieldAlert, Plus, Activity, Mail, Trash2, Home, LogOut, Pencil, Bell, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Dashboard.css';

interface ConditionItem {
  id: string;
  metric: string;
  conditionType: 'drops_below' | 'spikes_above' | 'changes_by';
  thresholdPercentage: number;
}

const PRESETS = [
  {
    name: '🤖 Bot Traffic Spike',
    description: 'Surge in traffic with plunging engagement rate (bots/scrapers)',
    matchType: 'ALL' as const,
    period: 'yesterday_vs_last_week',
    conditions: [
      { id: '1', metric: 'sessions', conditionType: 'spikes_above' as const, thresholdPercentage: 60 },
      { id: '2', metric: 'engagementRate', conditionType: 'drops_below' as const, thresholdPercentage: 30 }
    ]
  },
  {
    name: '🚨 Outage / Zero Traffic',
    description: 'Catastrophic drop in sessions or active users',
    matchType: 'ANY' as const,
    period: 'yesterday_vs_last_week',
    conditions: [
      { id: '1', metric: 'sessions', conditionType: 'drops_below' as const, thresholdPercentage: 40 },
      { id: '2', metric: 'activeUsers', conditionType: 'drops_below' as const, thresholdPercentage: 40 }
    ]
  },
  {
    name: '📉 Conversion / Revenue Drop',
    description: 'Significant dip in key events or total revenue',
    matchType: 'ANY' as const,
    period: 'last_7_vs_previous_7',
    conditions: [
      { id: '1', metric: 'keyEvents', conditionType: 'drops_below' as const, thresholdPercentage: 25 },
      { id: '2', metric: 'totalRevenue', conditionType: 'drops_below' as const, thresholdPercentage: 25 }
    ]
  },
  {
    name: '🛡️ Full Health Guard',
    description: 'Traffic drops, key event drops, or bounce rate spikes',
    matchType: 'ANY' as const,
    period: 'yesterday_vs_last_week',
    conditions: [
      { id: '1', metric: 'sessions', conditionType: 'drops_below' as const, thresholdPercentage: 25 },
      { id: '2', metric: 'keyEvents', conditionType: 'drops_below' as const, thresholdPercentage: 25 },
      { id: '3', metric: 'bounceRate', conditionType: 'spikes_above' as const, thresholdPercentage: 35 }
    ]
  }
];

export const Observer = () => {
  const { getToken, signOut } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedProperty, setSelectedProperty] = useState('');
  const [conditions, setConditions] = useState<ConditionItem[]>([
    { id: '1', metric: 'sessions', conditionType: 'drops_below', thresholdPercentage: 20 }
  ]);
  const [matchType, setMatchType] = useState<'ANY' | 'ALL'>('ANY');
  const [actionType, setActionType] = useState('email');
  const [period, setPeriod] = useState('yesterday_vs_last_week');
  const [alertEmail, setAlertEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProperties();
    fetchMonitors();
  }, []);

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

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setMatchType(preset.matchType);
    setPeriod(preset.period);
    setConditions(preset.conditions.map((c, i) => ({ ...c, id: String(Date.now() + i) })));
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: String(Date.now()),
        metric: 'keyEvents',
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
    setCreating(true);
    setErrorMsg('');
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
          alertEmail,
          matchType,
          conditions: conditions.map(c => ({
            metric: c.metric,
            conditionType: c.conditionType,
            thresholdPercentage: parseFloat(String(c.thresholdPercentage))
          }))
        })
      });
      
      if (res.ok) {
        setEditingId(null);
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
        let conditionLines = '';
        if (data.conditions && Array.isArray(data.conditions)) {
          conditionLines = data.conditions.map((c: any) => {
            const statusSymbol = c.isTriggered ? '🚨 TRIGGERED' : '✅ OK';
            const changeStr = `${c.percentChange > 0 ? '+' : ''}${c.percentChange.toFixed(1)}%`;
            const opSymbol = c.conditionType === 'spikes_above' ? '>' : c.conditionType === 'changes_by' ? '±' : '< -';
            return `• ${c.metric} (${opSymbol}${Math.abs(c.thresholdPercentage)}%): Prev ${c.pastVal.toLocaleString()} → Curr ${c.currentVal.toLocaleString()} (${changeStr}) [${statusSymbol}]`;
          }).join('\n');
        } else {
          conditionLines = `Evaluation: ${data.percentChange > 0 ? '+' : ''}${data.percentChange?.toFixed(2)}%`;
        }

        const logicLabel = data.matchType === 'ALL' ? 'Match ALL conditions (AND)' : 'Match ANY condition (OR)';
        const overallStatus = data.isTriggered ? '🚨 ANOMALY DETECTED (Alert Triggered)' : '✅ HEALTHY (All conditions normal)';

        alert(`GA4 Monitor Test Results:
---------------------------------------------
Status: ${overallStatus}
Rule Logic: ${logicLabel}

Evaluated Conditions:
${conditionLines}

Email Dispatch:
Status: ${data.emailStatus || 'Sent'}${data.emailError ? `\nNotice: ${data.emailError}` : ''}`);
      } else {
        alert(`Test failed: ${data?.error || `Server returned status ${res.status}`}`);
      }
    } catch (e: any) {
      alert(`An error occurred during test: ${e.message || e}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setSelectedProperty(m.property_id);
    setPeriod(m.comparison_period);
    setAlertEmail(m.alert_email);
    setMatchType(m.matchType || m.match_type || 'ANY');
    if (m.conditions && Array.isArray(m.conditions) && m.conditions.length > 0) {
      setConditions(m.conditions.map((c: any, idx: number) => ({
        id: String(idx + 1),
        metric: c.metric,
        conditionType: c.conditionType || c.condition_type || 'drops_below',
        thresholdPercentage: Math.abs(c.thresholdPercentage ?? c.threshold_percentage ?? 20)
      })));
    } else {
      setConditions([{
        id: '1',
        metric: m.metric || 'sessions',
        conditionType: m.condition_type || 'drops_below',
        thresholdPercentage: Math.abs(m.threshold_percentage || 20)
      }]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedProperty('');
    setConditions([{ id: '1', metric: 'sessions', conditionType: 'drops_below', thresholdPercentage: 20 }]);
    setMatchType('ANY');
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
                  <Activity size={18} style={{ color: '#6366F1' }}/> Trigger
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

                {/* Quick Presets */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="module-label" style={{ display: 'block', marginBottom: '0.6rem', color: '#9CA3AF' }}>
                    ⚡ Quick Presets (1-Click Anomaly Protection)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                    {PRESETS.map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => applyPreset(p)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.borderColor = '#6366F1';
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#F3F4F6', fontSize: '0.85rem' }}>{p.name}</div>
                        <div style={{ color: '#9CA3AF', fontSize: '0.72rem', lineHeight: '1.3' }}>{p.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
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
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '2fr 2fr 1.5fr auto', 
                          gap: '0.75rem', 
                          alignItems: 'flex-end',
                          background: 'rgba(255, 255, 255, 0.015)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          padding: '0.85rem',
                          borderRadius: '8px'
                        }}
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
                  <Mail size={18} style={{ color: '#10B981' }}/> Action
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
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
                    <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Alert Email</label>
                    <div className="input-wrapper">
                      <Mail className="input-icon" />
                      <input 
                        type="email" 
                        value={alertEmail}
                        onChange={e => setAlertEmail(e.target.value)}
                        className="module-input"
                        placeholder="alerts@example.com"
                        required
                      />
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
                        className="module-card"
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', cursor: 'default', flexWrap: 'wrap', gap: '1rem' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: m.status === 'active' ? '#34D399' : '#F59E0B' 
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
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                  }}>
                                    <strong>{c.metric}</strong> {op} {Math.abs(c.thresholdPercentage || c.threshold_percentage || 0)}%
                                  </span>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <div style={{ 
                            fontSize: '0.825rem', 
                            color: '#9CA3AF', 
                            display: 'flex', 
                            alignItems: 'center', 
                            background: 'rgba(255,255,255,0.05)',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '9999px'
                          }}>
                            <Mail size={13} style={{ marginRight: '0.4rem' }} /> {m.alert_email}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => handleTest(m.id)}
                              disabled={testingId === m.id}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: testingId === m.id ? '#10B981' : '#9CA3AF',
                                cursor: testingId === m.id ? 'wait' : 'pointer',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s'
                              }}
                              onMouseOver={(e) => { if(testingId !== m.id) e.currentTarget.style.color = '#10B981' }}
                              onMouseOut={(e) => { if(testingId !== m.id) e.currentTarget.style.color = '#9CA3AF' }}
                              title="Test & Run Health Check"
                            >
                              <Play size={18} />
                            </button>
                            <button 
                              onClick={() => handleEdit(m)}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#9CA3AF',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.color = '#3B82F6'}
                              onMouseOut={(e) => e.currentTarget.style.color = '#9CA3AF'}
                              title="Edit Monitor"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(m.id)}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#9CA3AF',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.color = '#EF4444'}
                              onMouseOut={(e) => e.currentTarget.style.color = '#9CA3AF'}
                              title="Delete Monitor"
                            >
                              <Trash2 size={18} />
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
    </PageTransition>
  );
};
