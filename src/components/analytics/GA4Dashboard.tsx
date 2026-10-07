import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, DollarSign, MousePointerClick } from 'lucide-react';

export const GA4Dashboard = () => {
  const { getToken } = useAuth();
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchReport(selectedProperty);
    } else {
      setData(null);
    }
  }, [selectedProperty]);

  const [errorMsg, setErrorMsg] = useState('');

  const fetchProperties = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/ga4/properties', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (res.ok) {
        setProperties(d.properties || []);
        if (d.properties && d.properties.length > 0) {
          setSelectedProperty(d.properties[0].name);
        }
      } else {
        setErrorMsg(d.error || 'Failed to fetch properties');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const fetchReport = async (propertyId: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = await getToken();
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
    <div style={{ marginTop: '3rem' }}>
      <div className="dashboard-section-header">
        <h3 className="dashboard-section-title">
          <Activity className="text-blue-400" size={24} />
          GA4 Performance (Last 30 Days)
        </h3>
        <p className="dashboard-section-subtitle">Live analytics data directly from your connected Google Analytics 4 properties.</p>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <select 
          value={selectedProperty} 
          onChange={e => setSelectedProperty(e.target.value)}
          className="module-input"
          style={{ maxWidth: '400px', marginBottom: errorMsg ? '0.5rem' : '2rem' }}
        >
          <option value="">Select a GA4 Property...</option>
          {properties.map(p => (
            <option key={p.name} value={p.name}>{p.displayName} ({p.name})</option>
          ))}
        </select>
        {errorMsg && (
          <div style={{ 
            color: '#EF4444', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '2rem', 
            fontSize: '0.875rem' 
          }}>
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
              <StatCard title="Total Revenue" value={`$${data.summary.revenue.toFixed(2)}`} icon={<DollarSign size={20} />} color="167, 139, 250" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              <div className="module-card" style={{ padding: '1.5rem', cursor: 'default' }}>
                <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.125rem' }}>Traffic Trends</h4>
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
          <div style={{ padding: '2rem 0', color: '#EF4444' }}>Failed to load property data.</div>
        ) : null}
      </div>
    </div>
  );
};
