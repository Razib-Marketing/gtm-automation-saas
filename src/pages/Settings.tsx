import { useState, useEffect } from 'react';
import { UserProfile, useUser, useAuth, RedirectToSignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, User, Sparkles, AlertCircle, ArrowUpCircle, Clock, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { getTimezoneOptions, getBrowserTimezone } from '../data/observerTemplates';
import { useWorkspace } from '../context/WorkspaceContext';
import './Settings.css';

export const Settings = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const { isSandboxMode, userTier: ctxTier } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'subscription' | 'schedule' | 'profile'>('subscription');
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'custom'>('free');
  const [deploymentCount, setDeploymentCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [scheduleTimezone, setScheduleTimezone] = useState(() => getBrowserTimezone());
  const [applyToExistingMonitors, setApplyToExistingMonitors] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState('');
  const [scheduleError, setScheduleError] = useState('');

  useEffect(() => {
    if (isSandboxMode) {
      setUserTier(ctxTier || 'pro');
      setDeploymentCount(2);
      setLoadingData(false);
      return;
    }
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const email = user.primaryEmailAddress?.emailAddress || '';
        const res = await fetch(`/api/user/me?clerkUserId=${user.id}&email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data && data.subscription_tier) {
          setUserTier(data.subscription_tier);
          setDeploymentCount(data.account_deployment_count || 0);
        }
        if (data?.schedule_time) {
          setScheduleTime(data.schedule_time);
        }
        if (data?.schedule_timezone) {
          setScheduleTimezone(data.schedule_timezone);
        }
      } catch (err) {
        console.error('Failed to fetch user settings data', err);
      } finally {
        setLoadingData(false);
      }
    };
    if (isSignedIn) {
      fetchUserData();
    }
  }, [isSignedIn, user, isSandboxMode, ctxTier]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchedule(true);
    setScheduleSuccess('');
    setScheduleError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/user/me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        setScheduleSuccess(
          data.updatedMonitors
            ? `Saved account schedule (${data.schedule_time} ${data.schedule_timezone}) and updated all active monitors.`
            : `Saved default account schedule (${data.schedule_time} ${data.schedule_timezone}).`
        );
      } else {
        setScheduleError(data.error || 'Failed to save schedule settings');
      }
    } catch (err: any) {
      setScheduleError(err.message || 'Network error while saving schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleCheckout = async (tier: 'pro') => {
    setCheckoutLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tier, containers: 10 }) // Defaulting to 10 workspaces for Pro as per requirements
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
      }
    } catch (_err) {
      alert('Error connecting to checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!isLoaded && !isSandboxMode) {
    return (
      <div className="dashboard-wrapper">
        <BackgroundMesh />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!isSignedIn && !isSandboxMode) {
    return <RedirectToSignIn />;
  }

  const proLimit = 10;
  const isFree = userTier === 'free';
  const isPro = userTier === 'pro';
  const isCustom = userTier === 'custom';

  return (
    <div className="dashboard-wrapper">
      <BackgroundMesh />
      

      <div className="settings-container">
        <div className="settings-layout">
          {/* Sidebar */}
          <aside className="settings-sidebar">
            <h2 className="sidebar-title">Settings</h2>
            <nav className="sidebar-nav">
              <button 
                className={`sidebar-link ${activeTab === 'subscription' ? 'active' : ''}`}
                onClick={() => setActiveTab('subscription')}
              >
                <CreditCard size={18} /> Subscription & Limits
              </button>
              <button 
                className={`sidebar-link ${activeTab === 'schedule' ? 'active' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                <Clock size={18} /> Observer Schedule
              </button>
              <button 
                className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} /> Account Details
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="settings-main">
            {activeTab === 'subscription' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="settings-panel"
              >
                <div className="panel-header">
                  <h2>Subscription & Limits</h2>
                  <p>Manage your billing, view your current plan, and track your usage limits.</p>
                </div>

                {loadingData ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <div className="panel-body">
                    {/* Current Plan Card */}
                    <div className="subscription-card">
                      <div className="subscription-header">
                        <div className="plan-info">
                          <span className="plan-badge">{userTier.toUpperCase()} PLAN</span>
                          <h3>Current Plan</h3>
                        </div>
                        {isFree && (
                          <button 
                            className="btn-upgrade"
                            onClick={() => handleCheckout('pro')}
                            disabled={checkoutLoading}
                          >
                            <Sparkles size={16} /> 
                            {checkoutLoading ? 'Loading...' : 'Upgrade to Pro'}
                          </button>
                        )}
                        {isPro && (
                          <button 
                            className="btn-home-link"
                            onClick={() => navigate('/billing')}
                          >
                            <ArrowUpCircle size={14} /> Enhance Plan
                          </button>
                        )}
                      </div>

                      <div className="plan-features-grid">
                        {isFree && (
                          <>
                            <div className="feature-item">
                              <AlertCircle size={16} className="text-yellow-400" />
                              <span>Basic modules only (Base GA4, Phone, Email)</span>
                            </div>
                            <div className="feature-item">
                              <AlertCircle size={16} className="text-yellow-400" />
                              <span>Limited deployments</span>
                            </div>
                          </>
                        )}
                        {(isPro || isCustom) && (
                          <>
                            <div className="feature-item">
                              <CheckCircleIcon color="#00F0FF" />
                              <span>Unlimited module deployments</span>
                            </div>
                            <div className="feature-item">
                              <CheckCircleIcon color="#00F0FF" />
                              <span>Access to all Pro modules</span>
                            </div>
                            <div className="feature-item">
                              <CheckCircleIcon color="#00F0FF" />
                              <span>{isCustom ? 'Custom GTM Workspaces' : 'Up to 10 GTM Workspaces'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Usage Progress */}
                    <div className="usage-card">
                      <h3>Deployment Usage</h3>
                      <p>Number of distinct GTM Workspaces you have deployed modules to.</p>
                      
                      <div className="usage-progress-container">
                        <div className="usage-stats">
                          <span className="usage-count">{deploymentCount}</span>
                          <span className="usage-limit">/ {isFree ? 'Limited' : isCustom ? 'Custom' : proLimit} Workspaces</span>
                        </div>
                        
                        {(isFree || isPro) && (
                          <div className="progress-bar-bg">
                            <div 
                              className="progress-bar-fill" 
                              style={{ 
                                width: isFree ? '100%' : `${Math.min((deploymentCount / proLimit) * 100, 100)}%`,
                                backgroundColor: isFree ? '#EF4444' : (deploymentCount >= proLimit ? '#EF4444' : '#00F0FF')
                              }}
                            ></div>
                          </div>
                        )}
                      </div>

                      {isPro && deploymentCount >= proLimit && (
                        <div className="limit-warning">
                          <AlertCircle size={16} />
                          <span>You have reached your limit of 10 Workspaces. Please contact support or upgrade to a Custom plan to increase your limits.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'schedule' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="settings-panel"
              >
                <div className="panel-header">
                  <h2>GA4 Observer Default Schedule</h2>
                  <p>Choose your preferred daily evaluation time and timezone for automated GA4 anomaly checks.</p>
                </div>

                {loadingData ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveSchedule} className="panel-body">
                    <div className="subscription-card">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#D1D5DB', fontSize: '0.85rem', fontWeight: 600 }}>
                            Preferred Evaluation Time
                          </label>
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={e => setScheduleTime(e.target.value)}
                            required
                            style={{
                              width: '100%',
                              padding: '0.7rem 0.9rem',
                              borderRadius: '0.6rem',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              background: 'rgba(15, 23, 42, 0.85)',
                              color: '#FFFFFF',
                              fontSize: '0.95rem',
                              colorScheme: 'dark',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#D1D5DB', fontSize: '0.85rem', fontWeight: 600 }}>
                            Account Timezone
                          </label>
                          <select
                            value={scheduleTimezone}
                            onChange={e => setScheduleTimezone(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.7rem 0.9rem',
                              borderRadius: '0.6rem',
                              border: '1px solid rgba(255, 255, 255, 0.12)',
                              background: 'rgba(15, 23, 42, 0.85)',
                              color: '#FFFFFF',
                              fontSize: '0.95rem',
                              boxSizing: 'border-box'
                            }}
                          >
                            {getTimezoneOptions(scheduleTimezone).map(tz => (
                              <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', color: '#CBD5E1', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                        <input
                          type="checkbox"
                          checked={applyToExistingMonitors}
                          onChange={e => setApplyToExistingMonitors(e.target.checked)}
                          style={{ accentColor: '#00F0FF', width: '16px', height: '16px' }}
                        />
                        <span>Update all existing active monitors to this schedule</span>
                      </label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                          type="submit"
                          disabled={savingSchedule}
                          className="btn-upgrade"
                          style={{ cursor: savingSchedule ? 'wait' : 'pointer' }}
                        >
                          <Clock size={16} />
                          {savingSchedule ? 'Saving Schedule...' : 'Save Schedule'}
                        </button>
                      </div>

                      {scheduleSuccess && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem 1rem',
                          borderRadius: '0.6rem',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#34D399',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Check size={16} />
                          <span>{scheduleSuccess}</span>
                        </div>
                      )}

                      {scheduleError && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '0.75rem 1rem',
                          borderRadius: '0.6rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#F87171',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <AlertCircle size={16} />
                          <span>{scheduleError}</span>
                        </div>
                      )}
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="settings-panel no-padding"
              >
                <UserProfile 
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "bg-transparent border-none shadow-none w-full",
                      navbar: "hidden md:flex",
                      navbarMobileMenuButton: "text-white",
                      headerTitle: "text-white text-2xl font-bold",
                      headerSubtitle: "text-gray-400",
                      profileSectionTitleText: "text-white font-semibold text-lg",
                      profileSectionTitle: "border-b border-white/10 pb-2 mb-4",
                      profileSectionContent: "text-gray-300",
                      breadcrumbsItem: "text-gray-400",
                      breadcrumbsItemDivider: "text-gray-600",
                      formButtonPrimary: "bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 hover:bg-[#00F0FF]/20 transition-all rounded-full px-6",
                      formButtonReset: "text-gray-400 hover:bg-white/5",
                      formFieldLabel: "text-gray-300",
                      formFieldInput: "bg-white/5 border-white/10 text-white rounded-full px-4 focus:ring-[#00F0FF] focus:border-[#00F0FF]",
                      dividerLine: "bg-white/10",
                      dividerText: "text-gray-500",
                      badge: "bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/20",
                      alert: "bg-red-500/10 border-red-500/20 text-red-400",
                      activeDeviceIcon: "text-[#00F0FF]",
                    }
                  }}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckCircleIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
