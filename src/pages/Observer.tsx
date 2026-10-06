import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ShieldAlert, Plus, Activity, Mail, Trash2, Home, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Dashboard.css';

export const Observer = () => {
  const { getToken, signOut } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProperty, setSelectedProperty] = useState('');
  const [metric, setMetric] = useState('sessions');
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
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = await getToken();
      const propName = properties.find(p => p.name === selectedProperty)?.displayName || 'Unknown Property';
      
      const res = await fetch('/api/ga4/monitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyId: selectedProperty,
          propertyName: propName,
          metric,
          thresholdPercentage: parseFloat(threshold),
          comparisonPeriod: period,
          alertEmail
        })
      });

      if (res.ok) {
        await fetchMonitors();
        setSelectedProperty('');
        setAlertEmail('');
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      alert('Failed to create monitor');
    } finally {
      setCreating(false);
    }
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
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}
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
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
              
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

              <div>
                <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Metric to Monitor</label>
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
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="module-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Condition</label>
                  <select className="module-input" style={{ paddingLeft: '1rem' }} disabled>
                    <option>Drops below</option>
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
                    placeholder="-20"
                    required
                  />
                </div>
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

              <button 
                type="submit" 
                disabled={creating || !selectedProperty}
                className="btn-deploy-bulk"
                style={{ alignSelf: 'flex-start', marginTop: '1rem' }}
              >
                {creating ? 'Creating...' : (
                  <>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add Monitor
                  </>
                )}
              </button>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                          Drops {m.threshold_percentage}% ({m.comparison_period})
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
                        >
                          <Trash2 size={18} />
                        </button>
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
