import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { Zap, ShieldCheck } from 'lucide-react';
import { GA4Dashboard } from '../components/analytics/GA4Dashboard';
import { PageTransition } from '../components/ui/PageTransition';
import { useUser } from '@clerk/clerk-react';
import '../pages/Dashboard.css';

export const Analytics: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'custom'>('free');
  const [deploymentCount, setDeploymentCount] = useState(0);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    
    const fetchData = async () => {
      try {
        const email = user?.primaryEmailAddress?.emailAddress || '';
        
        // Fetch User Tier and Limits
        const meRes = await fetch(`/api/user/me?clerkUserId=${user?.id}&email=${encodeURIComponent(email)}`);
        const meData = await meRes.json();
        if (meData && meData.subscription_tier) {
          setUserTier(meData.subscription_tier);
          setDeploymentCount(meData.account_deployment_count || 0);
        }

        // Fetch Recent Audits
        const auditRes = await fetch(`/api/gtm/audit-logs?userId=${user?.id}`);
        const auditData = await auditRes.json();
        if (auditData.logs) {
          setRecentAudits(auditData.logs);
        }
      } catch (err) {
        console.error('Failed to fetch analytics data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, isLoaded]);

  const limit = userTier === 'free' ? 5 : userTier === 'pro' ? 10 : 999;
  const progressPercent = Math.min((deploymentCount / limit) * 100, 100);

  const totalTags = recentAudits.reduce((acc, curr) => acc + (Number(curr.tagCount) || 0), 0);
  const totalTriggers = recentAudits.reduce((acc, curr) => acc + (Number(curr.triggerCount) || 0), 0);
  const totalVariables = recentAudits.reduce((acc, curr) => acc + (Number(curr.variableCount) || 0), 0);
  const maxMetric = Math.max(totalTags, totalTriggers, totalVariables, 1);

  const CircularChart = ({ value, max, label, color }: { value: number, max: number, label: string, color: string }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / max) * circumference;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
            <motion.circle 
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              cx="50" cy="50" r={radius} 
              stroke={color} strokeWidth="8" fill="none" 
              strokeDasharray={circumference}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{value}</span>
          </div>
        </div>
        <span style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '1rem', fontWeight: 500 }}>{label}</span>
      </div>
    );
  };

  return (
    <PageTransition locationKey="analytics">
      <BackgroundMesh />
      <div className="dashboard-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
        >
          <h1 className="dashboard-title">Analytics & Usage</h1>
          <p className="dashboard-subtitle">Monitor your deployment limits and view historical workspace audits.</p>
        </motion.div>

        <GA4Dashboard />

        <div className="settings-section" style={{ marginTop: '3rem' }}>
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">
              <Zap className="text-yellow-400" size={24} />
              Platform Usage
            </h3>
            <p className="dashboard-section-subtitle">Your current subscription tier limits and deployment statistics.</p>
          </div>
          
          <div className="module-card" style={{ padding: '2rem', marginTop: '1.5rem', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>Automated Deployments</h4>
                <p style={{ margin: 0, color: '#9CA3AF', marginTop: '0.25rem', fontSize: '0.875rem' }}>
                  Deployments used this billing cycle
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#00F0FF' }}>{deploymentCount}</span>
                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}> / {userTier === 'custom' ? 'Unlimited' : limit}</span>
              </div>
            </div>
            
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #00F0FF 0%, #34D399 100%)', borderRadius: '6px' }}
              />
            </div>
          </div>
          
          <div className="module-card" style={{ padding: '2rem', marginTop: '1.5rem', cursor: 'default' }}>
            <h4 style={{ margin: 0, fontSize: '1.25rem', color: 'white', marginBottom: '1.5rem' }}>Aggregated Components</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <CircularChart value={totalTags} max={maxMetric} label="Tags" color="#00F0FF" />
              <CircularChart value={totalTriggers} max={maxMetric} label="Triggers" color="#34D399" />
              <CircularChart value={totalVariables} max={maxMetric} label="Variables" color="#FBBF24" />
            </div>
          </div>
        </div>

        <div className="settings-section" style={{ marginTop: '3rem' }}>
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">
              <ShieldCheck className="text-green-400" size={24} />
              Recent Workspace Audits
            </h3>
            <p className="dashboard-section-subtitle">Historical records of GTM workspaces you have audited.</p>
          </div>
          
          <div className="module-card" style={{ marginTop: '1.5rem', cursor: 'default', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '1rem' }}>
                <div style={{ height: '2rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.25rem', marginBottom: '1rem' }} />
                <div style={{ height: '2rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.25rem', marginBottom: '1rem' }} />
                <div style={{ height: '2rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.25rem' }} />
              </div>
            ) : recentAudits.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>No audits have been performed yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Date</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>GTM ID</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Tags</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Triggers</th>
                      <th style={{ padding: '1rem', color: '#9CA3AF', fontWeight: 600, fontSize: '0.875rem' }}>Variables</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAudits.map((audit) => (
                      <tr key={audit.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>
                          {new Date(audit.createdAt).toLocaleDateString()} {new Date(audit.createdAt).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '1rem', color: '#00F0FF', fontSize: '0.875rem', fontWeight: 500 }}>
                          {audit.gtmId}
                        </td>
                        <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>{audit.tagCount}</td>
                        <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>{audit.triggerCount}</td>
                        <td style={{ padding: '1rem', color: 'white', fontSize: '0.875rem' }}>{audit.variableCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
