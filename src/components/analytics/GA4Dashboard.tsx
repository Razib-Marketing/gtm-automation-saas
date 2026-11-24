import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, DollarSign, MousePointerClick } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

interface GA4DashboardProps {
  lockedPropertyId?: string;
  lockedPropertyName?: string;
  projectName?: string;
  projectId?: string;
}

function buildSandboxReport(seedKey = 'default') {
  const isApex = seedKey.includes('apex') || seedKey.includes('491');
  const baseSessions = isApex ? 640 : 410;
  const chartData = Array.from({ length: 14 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (13 - i));
    const wave = Math.sin(i * 0.7) * (isApex ? 75 : 52);
    const sessions = Math.max(80, Math.round(baseSessions + wave + i * 6));
    const conversions = Math.max(4, Math.round(sessions * (isApex ? 0.042 : 0.056)));
    return {
      date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions,
      conversions
    };
  });
  const totalSessions = chartData.reduce((s, d) => s + d.sessions, 0) * 2;
  const totalConv = chartData.reduce((s, d) => s + d.conversions, 0) * 2;
  return {
    summary: {
      sessions: totalSessions,
      activeUsers: Math.round(totalSessions * 0.81),
      conversions: totalConv,
      revenue: isApex ? 42680.5 : 88420.0
    },
    chartData
  };
}

export const GA4Dashboard = ({
  lockedPropertyId,
  lockedPropertyName,
  projectName,
  projectId
}: GA4DashboardProps = {}) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { isSandboxMode } = useWorkspace();
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState(lockedPropertyId || '');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (lockedPropertyId) {
      setSelectedProperty(lockedPropertyId);
    }
  }, [lockedPropertyId]);

  useEffect(() => {
    if (isSandboxMode) {
      if (lockedPropertyId || selectedProperty) {
        setData(buildSandboxReport(projectId || lockedPropertyId || selectedProperty));
      } else {
        setData(null);
      }
      setErrorMsg('');
      setLoading(false);
      return;
    }
    if (isLoaded && isSignedIn && !lockedPropertyId) {
      fetchProperties();
    }
  }, [isLoaded, isSignedIn, isSandboxMode, lockedPropertyId, projectId]);

  useEffect(() => {
    if (isSandboxMode) {
      if (selectedProperty) {
        setData(buildSandboxReport(projectId || selectedProperty));
      }
      return;
    }
    if (selectedProperty && isLoaded && isSignedIn) {
      fetchReport(selectedProperty);
    } else {
      setData(null);
    }
  }, [selectedProperty, isLoaded, isSignedIn, isSandboxMode, projectId]);

  const fetchProperties = async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch('/api/ga4/properties', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (res.ok) {
        setProperties(d.properties || []);
        setErrorMsg('');
        if (!lockedPropertyId && d.properties && d.properties.length > 0) {
          setSelectedProperty(d.properties[0].name);
        }
      } else {
        setErrorMsg(d.error || 'Failed to fetch properties');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error connecting to analytics');
    }
  };

  const fetchReport = async (propertyId: string) => {
    if (!isLoaded || !isSignedIn || !propertyId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const token = await getToken();
      if (!token) {
        setErrorMsg('Session expired. Please refresh the page.');
        return;
      }
      const res = await fetch(`/api/ga4/report?propertyId=${encodeURIComponent(propertyId)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setData(d);
        setErrorMsg('');
      } else {
        setErrorMsg(d.error || `Failed to fetch report from GA4 (${res.status})`);
        setData(null);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to fetch report from GA4');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }: any) => (
    <div className="module-card" style={{ padding: '1.5rem', cursor: 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '0.5rem', margin: 0 }}>{title}</p>
          <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{value}</h3>
        </div>
        <div style={{ padding: '0.75rem', background: `rgba(${color}, 0.1)`, borderRadius: '0.5rem', color: `rgb(${color})` }}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: '2.25rem' }}>
      <div className="dashboard-section-header">
        <h3 className="dashboard-section-title">
          <Activity className="text-blue-400" size={24} />
          GA4 Performance (Last 30 Days){projectName ? ` — ${projectName}` : ''}
        </h3>
        <p className="dashboard-section-subtitle">
          {lockedPropertyId
            ? `Scoped strictly to project property: ${lockedPropertyName || lockedPropertyId}`
            : 'Live analytics data directly from your connected Google Analytics 4 properties.'}
        </p>
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        {!lockedPropertyId ? (
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="module-input"
            style={{ maxWidth: '400px', marginBottom: errorMsg ? '0.5rem' : '2rem' }}
          >
            <option value="">Select a GA4 Property...</option>
            {properties.map((p) => (
              <option key={p.name} value={p.name}>
                {p.displayName} ({p.name})
              </option>
            ))}
          </select>
        ) : null}

        {!selectedProperty && lockedPropertyId === undefined && !loading && (
          <div style={{ padding: '1.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', color: '#9CA3AF', fontSize: '0.9rem' }}>
            Select a property above to load GA4 telemetry.
          </div>
        )}

        {lockedPropertyId === '' && (
          <div style={{ padding: '1.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#9CA3AF', fontSize: '0.9rem' }}>
            No GA4 property is linked to this project yet. Configure one in Project Settings to see 30-day performance metrics.
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              color: '#EF4444',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '2rem',
              fontSize: '0.875rem'
            }}
          >
            <strong>Google Analytics Error:</strong> {errorMsg}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: '#9CA3AF' }}>Loading analytics data...</div>
        ) : data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <StatCard title="Total Sessions" value={data.summary.sessions.toLocaleString()} icon={<Users size={20} />} color="0, 240, 255" />
              <StatCard title="Active Users" value={data.summary.activeUsers.toLocaleString()} icon={<Activity size={20} />} color="52, 211, 153" />
              <StatCard title="Conversions" value={data.summary.conversions.toLocaleString()} icon={<MousePointerClick size={20} />} color="250, 204, 21" />
              <StatCard title="Total Revenue" value={`$${data.summary.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<DollarSign size={20} />} color="167, 139, 250" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              <div className="module-card" style={{ padding: '1.5rem', cursor: 'default' }}>
                <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.125rem' }}>
                  Traffic &amp; Conversion Trends {isSandboxMode ? '(Local Preview)' : ''}
                </h4>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1C1F26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                        itemStyle={{ color: 'white' }}
                      />
                      <Line type="monotone" dataKey="sessions" stroke="#00F0FF" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="Sessions" />
                      <Line type="monotone" dataKey="conversions" stroke="#34D399" strokeWidth={3} dot={false} name="Conversions" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        ) : selectedProperty ? (
          <div style={{ padding: '2rem 0', color: '#9CA3AF' }}>No analytics telemetry loaded yet for this property.</div>
        ) : null}
      </div>
    </div>
  );
};
