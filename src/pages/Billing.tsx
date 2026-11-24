import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  Sparkles,
  Shield,
  CreditCard,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  FlaskConical
} from 'lucide-react';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { PageTransition } from '../components/ui/PageTransition';
import { useWorkspace } from '../context/WorkspaceContext';
import { setSandboxTier } from '../utils/localDemoStore';
import './Dashboard.css';
import './Pricing.css';

export const Billing: React.FC = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { userTier, hasActiveSubscription, isSandboxMode, refreshWorkspace, projects } = useWorkspace();

  const [containers, setContainers] = useState(10);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const params = new URLSearchParams(location.search);
  const requiresSubReason = params.get('reason') === 'subscription_required';
  const checkoutCancelled = params.get('checkout') === 'cancelled';

  const baseCustomPrice = Math.max(149, Math.ceil(containers * 14.9));
  const hasDiscount = containers >= 15;
  const customPrice = hasDiscount ? Math.floor(baseCustomPrice * 0.9) : baseCustomPrice;

  const handlePurchase = async (tier: 'pro' | 'custom') => {
    setErrorMsg('');

    if (isSandboxMode) {
      setSandboxTier(tier);
      await refreshWorkspace();
      navigate('/onboarding?checkout=success');
      return;
    }

    setCheckoutLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tier, containers: tier === 'custom' ? containers : 10 })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg(data.error || 'Failed to initiate subscription checkout');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while initiating checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <PageTransition locationKey="billing">
      <BackgroundMesh />
      <div className="dashboard-container" style={{ maxWidth: '1160px', margin: '0 auto' }}>
        {/* Flow Stepper */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            flexWrap: 'wrap',
            padding: '0.85rem 1.15rem',
            borderRadius: '12px',
            background: 'rgba(18, 18, 24, 0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '1.75rem',
            fontSize: '0.82rem'
          }}
        >
          <span style={{ color: '#10B981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={15} /> 1. Account Created
          </span>
          <span style={{ color: '#4B5563' }}>→</span>
          <span
            style={{
              color: hasActiveSubscription ? '#10B981' : '#00F0FF',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            {hasActiveSubscription ? <CheckCircle2 size={15} /> : <CreditCard size={15} />}
            2. Select Package &amp; Billing
          </span>
          <span style={{ color: '#4B5563' }}>→</span>
          <span style={{ color: '#9CA3AF' }}>3. Project Onboarding</span>
          <span style={{ color: '#4B5563' }}>→</span>
          <span style={{ color: '#9CA3AF' }}>4. Organization &amp; Project Workspaces</span>
        </motion.div>

        <div className="dashboard-header" style={{ textAlign: 'left', marginBottom: '1.75rem' }}>
          <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <CreditCard size={30} color="#00F0FF" />
            Organization Billing &amp; Subscription Plan
          </h1>
          <p className="dashboard-subtitle">
            {hasActiveSubscription
              ? `Your organization is currently on the ${userTier.toUpperCase()} package. Manage capacity or launch project onboarding.`
              : 'Select a subscription package to unlock your Organization Dashboard, guided Project Onboarding, GTM automation, and 24/7 GA4 Observer.'}
          </p>
        </div>

        {requiresSubReason && !hasActiveSubscription && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#FCD34D',
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>
              <strong>Subscription Required:</strong> Complete package activation below before creating or accessing your organization projects.
            </span>
          </div>
        )}

        {checkoutCancelled && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}
          >
            <AlertCircle size={20} />
            <span>Checkout was cancelled. Select a package whenever you are ready to continue to onboarding.</span>
          </div>
        )}

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#FCA5A5',
              marginBottom: '1.5rem',
              fontSize: '0.9rem'
            }}
          >
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {hasActiveSubscription && (
          <div
            className="module-card"
            style={{
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              background: 'rgba(0, 240, 255, 0.05)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              cursor: 'default'
            }}
          >
            <div>
              <div style={{ color: '#00F0FF', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                ACTIVE SUBSCRIPTION
              </div>
              <h3 style={{ margin: '0.25rem 0', color: 'white', fontSize: '1.2rem' }}>
                GTMObserver {userTier === 'custom' ? 'Custom Scale' : 'Pro'} Plan
              </h3>
              <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.88rem' }}>
                {projects.length === 0
                  ? 'You have no projects configured yet. Start onboarding to set up your first project.'
                  : `You currently have ${projects.length} active project${projects.length === 1 ? '' : 's'} in your organization.`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/onboarding" className="btn-deploy-bulk" style={{ marginTop: 0, textDecoration: 'none', padding: '0.75rem 1.25rem' }}>
                + Configure New Project <ArrowRight size={16} style={{ marginLeft: '0.4rem' }} />
              </Link>
              <Link
                to="/organization"
                style={{
                  textDecoration: 'none',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                Open Organization Dashboard
              </Link>
            </div>
          </div>
        )}

        {isSandboxMode && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.85rem 1.1rem',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#E9D5FF',
              marginBottom: '1.5rem',
              fontSize: '0.85rem'
            }}
          >
            <FlaskConical size={18} color="#C084FC" style={{ flexShrink: 0 }} />
            <span>
              <strong>Local Test Mode:</strong> Clicking a plan button below simulates instant subscription purchase and takes you straight into <strong>Project Onboarding</strong>.
            </span>
          </div>
        )}

        <div
          className="pricing-grid-container"
          style={{ maxWidth: '100%', padding: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))' }}
        >
          {/* Pro Package */}
          <div className="pricing-card-box active-tier">
            <div className="current-plan-badge">
              {userTier === 'pro' ? 'Current Plan' : 'Recommended'}
            </div>
            <div className="tier-title-container">
              <div className="tier-title-header">
                <Sparkles size={20} className="feature-icon-active" />
                <h3>Pro Organization</h3>
              </div>
              <div className="tier-price-display">
                $149<span>/mo</span>
              </div>
              <p className="tier-desc">For agencies &amp; hospitality/e-commerce teams</p>
            </div>

            <ul className="tier-features-list">
              <li><Check className="feature-icon-active" size={20} /> <span>Up to 10 Isolated Client Projects</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Unlimited GTM Recipe Deployments</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Unlimited GTM Workspace Audits + PDF</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Up to 10 GA4 Observer Monitors</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>22-Point GA4 Property Audits + PDF</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Custom Schedules, WoW/MoM/YoY &amp; Multi-Email Alerts</span></li>
            </ul>

            <button
              onClick={() => handlePurchase('pro')}
              disabled={checkoutLoading || (!isSandboxMode && userTier === 'pro')}
              className="checkout-btn primary"
            >
              {checkoutLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isSandboxMode ? (
                'Activate Pro & Start Onboarding →'
              ) : userTier === 'pro' ? (
                'Current Active Plan'
              ) : (
                'Select Pro & Continue to Onboarding →'
              )}
            </button>
          </div>

          {/* Custom Package */}
          <div className="pricing-card-box">
            {userTier === 'custom' && (
              <div
                className="current-plan-badge"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #00F0FF)', color: 'white', border: 'none' }}
              >
                Current Plan
              </div>
            )}
            <div className="tier-title-container">
              <div className="tier-title-header">
                <Shield size={20} className="feature-icon-active" />
                <h3>Custom Enterprise Scale</h3>
              </div>
              <div className="tier-price-display">
                {hasDiscount && (
                  <span style={{ textDecoration: 'line-through', fontSize: '1.25rem', color: '#6B7280', marginRight: '0.5rem' }}>
                    ${baseCustomPrice}
                  </span>
                )}
                ${customPrice}
                <span>/mo</span>
              </div>
              <p className="tier-desc">
                Scale across 10–100+ client projects
                {hasDiscount && (
                  <span style={{ display: 'block', color: '#10B981', fontWeight: 600, marginTop: '0.25rem', fontSize: '0.875rem' }}>
                    10% Volume Discount Applied!
                  </span>
                )}
              </p>
            </div>

            <div className="slider-container">
              <label className="slider-label">
                Number of Projects, GTM Containers &amp; Monitors: <span>{containers}</span>
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={containers}
                onChange={(e) => setContainers(parseInt(e.target.value, 10))}
                className="custom-range"
              />
            </div>

            <ul className="tier-features-list">
              <li><Check className="feature-icon-active" size={20} /> <span>{containers} Projects, GTM Containers &amp; GA4 Monitors</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Unlimited GTM &amp; 22-Point GA4 Audits</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>White-Label Sender Domains</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Unlimited Multi-Recipient Alert Lists</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Priority Onboarding &amp; SLAs</span></li>
            </ul>

            <button
              onClick={() => handlePurchase('custom')}
              disabled={checkoutLoading}
              className="checkout-btn outline"
            >
              {checkoutLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isSandboxMode ? (
                `Activate Custom (${containers}) & Start Onboarding →`
              ) : userTier === 'custom' ? (
                'Update Capacity'
              ) : (
                'Select Custom & Continue to Onboarding →'
              )}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
