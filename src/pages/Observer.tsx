import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ShieldAlert, Plus, Activity, Mail, Trash2, Home, LogOut, Pencil, Bell, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Dashboard.css';

export const Observer = () => {
  const { getToken, signOut } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedProperty, setSelectedProperty] = useState('');
  const [metric, setMetric] = useState('sessions');
  const [conditionType, setConditionType] = useState('drops_below');
  const [actionType, setActionType] = useState('email');
  const [threshold, setThreshold] = useState('-20');
  const [period, setPeriod] = useState('daily');
  const [alertEmail, setAlertEmail] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchMonitors();
  }, []);

  const [errorMsg, setErrorMsg] = useState('');

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
          metric,
          thresholdPercentage: parseFloat(threshold),
          comparisonPeriod: period,
          conditionType: conditionType,
          alertEmail
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

    const [testingId, setTestingId] = useState<string | null>(null);

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
      const data = await res.json();
      if (res.ok) {
        alert(`Test Email Sent!

Result: ${data.percentChange > 0 ? '+' : ''}${data.percentChange.toFixed(2)}%
Triggered Alert: ${data.isTriggered ? 'YES' : 'NO'}`);
      } else {
        alert(`Test failed: ${data.error}`);
      }
    } catch (e) {
      alert('An error occurred during test');
    } finally {
      setTestingId(null);
    }
  };

  const handleEdit = (m: any) => {
    setEditingId(m.id);
    setSelectedProperty(m.property_id);
    setMetric(m.metric);
    setConditionType(m.condition_type || 'drops_below');
    setThreshold(Math.abs(m.threshold_percentage).toString());
    setPeriod(m.comparison_period);
    setAlertEmail(m.alert_email);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedProperty('');
    setThreshold('20');
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
          style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'stretch', marginBottom: '2rem' }}
        >
          <div className="dashboard-header" style={{ margin: 0, flex: '1 1 400px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
          </div>
          <div style={{ flex: '0 0 380px' }}>
          {/* Recent Alerts Dashboard */}
          <div className="selection-card" style={{ margin: 0, height: '100%' }}>
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
                <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
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
                      <option value="daily">Previous Day</option>
                      <option value="weekly">Previous Week (Same Day)</option>
                      <option value="monthly">Previous Month (Same Date)</option>
                      <option value="yearly">Previous Year (Same Date)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* CONDITION SECTION */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ color: 'white', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={18} style={{ color: '#F59E0B' }}/> Condition
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Metric</label>
                      <select 
                        value={metric} 
                        onChange={e => setMetric(e.target.value)}
                        className="module-input"
                        style={{ paddingLeft: '1rem' }}
                      >
                        <option value="sessions">Sessions</option>
                        <option value="conversions">Conversions</option>
                        <option value="totalRevenue">Total Revenue</option>
                        <option value="activeUsers">Active Users</option>
                        <option value="newUsers">New Users</option>
                        <option value="eventCount">Event Count</option>
                        <option value="bounceRate">Bounce Rate</option>
                        <option value="engagementRate">Engagement Rate</option>
                      </select>
                    </div>

                    <div>
                      <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Operator</label>
                      <select 
                        value={conditionType}
                        onChange={e => setConditionType(e.target.value)}
                        className="module-input" 
                        style={{ paddingLeft: '1rem' }}
                      >
                        <option value="drops_below">Drops below</option>
                        <option value="spikes_above">Spikes above</option>
                        <option value="changes_by">Changes by (±)</option>
                      </select>
                    </div>

                    <div>
                      <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Threshold (%)</label>
                      <input 
                        type="number" 
                        value={threshold}
                        onChange={e => setThreshold(e.target.value)}
                        className="module-input"
                        style={{ paddingLeft: '1rem' }}
                        placeholder="20"
                        required
                      />
                    </div>
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
                  {monitors.map(m => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={m.id} 
                      className="module-card"
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', cursor: 'default' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: m.status === 'active' ? '#34D399' : '#F59E0B' 
                          }} />
                          <h4 style={{ color: 'white', margin: 0, fontWeight: 600 }}>{m.property_name}</h4>
                        </div>
                        <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Activity size={14} /> {m.metric} 
                          <span style={{ color: '#4B5563' }}>•</span>
                          {m.condition_type === 'spikes_above' ? 'Spikes > ' : m.condition_type === 'changes_by' ? 'Changes ± ' : 'Drops < '}{Math.abs(m.threshold_percentage)}% ({m.comparison_period})
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: '#9CA3AF', 
                          display: 'flex', 
                          alignItems: 'center', 
                          background: 'rgba(255,255,255,0.05)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px'
                        }}>
                          <Mail size={14} style={{ marginRight: '0.5rem' }} /> {m.alert_email}
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
                            title="Test & Send Email"
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
