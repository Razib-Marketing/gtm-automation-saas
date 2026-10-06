import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { FolderKanban, ShieldAlert, ExternalLink } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { useUser, useAuth } from '@clerk/clerk-react';
import '../pages/Dashboard.css';

export const Projects: React.FC = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    
    const checkAuth = async () => {
      try {
        const res = await fetch(`/api/auth/status?clerkUserId=${user?.id}`);
        const data = await res.json();
        setHasGoogleAuth(data.hasAuth);
        
        if (data.hasAuth) {
          const token = await getToken();
          const accRes = await fetch('/api/gtm/accounts', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const accData = await accRes.json();
          setAccounts(accData.account || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [user, isLoaded, getToken]);

  const handleGoogleOAuth = () => {
    window.location.href = `/api/auth/google/login?clerkUserId=${user?.id}`;
  };

  return (
    <PageTransition locationKey="projects">
      <BackgroundMesh />
      <div className="dashboard-container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-header"
        >
          <h1 className="dashboard-title">Projects & Workspaces</h1>
          <p className="dashboard-subtitle">Manage your connected Google Tag Manager accounts and linked projects.</p>
        </motion.div>

        {!hasGoogleAuth && !loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="oauth-card"
          >
            <ShieldAlert className="oauth-icon text-yellow-400" />
            <h2>Connect Google Tag Manager</h2>
            <p>To view your projects, you must grant us Editor access to your Tag Manager containers.</p>
            <button onClick={handleGoogleOAuth} className="btn-oauth">
              Authorize GTM Access
            </button>
          </motion.div>
        )}

        {hasGoogleAuth && (
          <div className="settings-section" style={{ marginTop: '2rem' }}>
            <div className="dashboard-section-header">
              <h3 className="dashboard-section-title">
                <FolderKanban className="text-blue-400" size={24} />
                Connected GTM Accounts
              </h3>
              <p className="dashboard-section-subtitle">Here are all the Google Tag Manager accounts you currently have access to.</p>
            </div>
            
            {loading ? (
              <div className="checkbox-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', marginTop: '1.5rem' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="module-card" style={{ padding: '1.5rem', opacity: 0.7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: '1rem', width: '60%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', marginBottom: '0.5rem' }} />
                        <div style={{ height: '0.75rem', width: '40%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : accounts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>No GTM accounts found.</div>
            ) : (
              <div className="checkbox-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', marginTop: '1.5rem' }}>
                {accounts.map((acc, index) => (
                  <motion.div 
                    key={acc.accountId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="module-card"
                    style={{ padding: '1.5rem' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', color: '#00F0FF' }}>
                          <FolderKanban size={20} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: 600 }}>{acc.name}</h4>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>Account ID: {acc.accountId}</p>
                        </div>
                      </div>
                      <a href={`https://tagmanager.google.com/#/home`} target="_blank" rel="noopener noreferrer" style={{ color: '#6B7280', transition: 'color 0.2s' }} className="hover:text-blue-400">
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
};
