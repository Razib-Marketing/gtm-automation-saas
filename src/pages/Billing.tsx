import React, { useEffect, useState } from 'react';
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
  FlaskConical,
  ExternalLink,
  Plus,
  Building2
} from 'lucide-react';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import { PageTransition } from '../components/ui/PageTransition';
import { useWorkspace } from '../context/WorkspaceContext';
import { setSandboxTier } from '../utils/localDemoStore';
import './Dashboard.css';
import './Pricing.css';

interface PolarProductUI {
  id: string;
  tier: 'pro' | 'custom';
  name: string;
  description: string;
  isRecurring: boolean;
  recurringInterval: string | null;
  amountType: 'fixed' | 'custom' | 'free';
  priceAmount: number | null;
  priceCurrency: string;
  minimumAmount: number | null;
  maximumAmount: number | null;
  presetAmount: number | null;
  benefits: string[];
}

function formatPolarPrice(cents: number | null, currency = 'usd'): string {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return '$149';
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2
    }).format(amount);
  } catch (_) {
    return `$${Math.round(amount)}`;
  }
}

export const Billing: React.FC = () => {
  const { getToken, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { userTier, workspaceLimit, hasActiveSubscription, isSandboxMode, refreshWorkspace, projects } = useWorkspace();

  const [containers, setContainers] = useState(25);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [proProduct, setProProduct] = useState<PolarProductUI | null>(null);
  const [customProduct, setCustomProduct] = useState<PolarProductUI | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const params = new URLSearchParams(location.search);
  const requiresSubReason = params.get('reason') === 'subscription_required';
  const checkoutCancelled = params.get('checkout') === 'cancelled';

  useEffect(() => {
    if (isSandboxMode || !isSignedIn) return;
    let cancelled = false;
    const loadPolarCatalog = async () => {
      setLoadingCatalog(true);
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch('/api/polar/products', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          if (data.proProduct) setProProduct(data.proProduct);
          if (data.customProduct) setCustomProduct(data.customProduct);
        }
      } catch (_) {
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    };
    loadPolarCatalog();
    return () => {
      cancelled = true;
    };
  }, [isSandboxMode, isSignedIn, getToken]);

  const baseCustomPrice = Math.max(149, Math.ceil(containers * 14.9));
  const hasDiscount = containers >= 15;
  const computedCustomPrice = hasDiscount ? Math.floor(baseCustomPrice * 0.9) : baseCustomPrice;

  const isCustomVariablePrice = !customProduct || customProduct.amountType === 'custom';
  const proDisplayPrice = proProduct && proProduct.priceAmount !== null
    ? formatPolarPrice(proProduct.priceAmount, proProduct.priceCurrency)
    : '$149';
  const proIntervalLabel =
    proProduct?.isRecurring === false
      ? 'one-time'
      : `/${proProduct?.recurringInterval === 'year' ? 'yr' : 'mo'}`;

  const customDisplayPrice = isCustomVariablePrice
    ? `$${computedCustomPrice}`
    : formatPolarPrice(customProduct?.priceAmount ?? null, customProduct?.priceCurrency);
  const customIntervalLabel =
    customProduct?.isRecurring === false
      ? 'one-time'
      : `/${customProduct?.recurringInterval === 'year' ? 'yr' : 'mo'}`;

  const proFeatures =
    proProduct?.benefits && proProduct.benefits.length > 0
      ? proProduct.benefits
      : [
          'Up to 10 Isolated Client Projects',
          'Unlimited GTM Recipe Deployments',
          'Unlimited GTM Workspace Audits + PDF',
          'Up to 10 GA4 Observer Monitors',
          '22-Point GA4 Property Audits + PDF',
          'Custom Schedules, WoW/MoM/YoY & Multi-Email Alerts'
        ];

  const customFeatures =
    customProduct?.benefits && customProduct.benefits.length > 0
      ? customProduct.benefits
      : [
          `${containers} Projects, GTM Containers & GA4 Monitors`,
          'Unlimited GTM & 22-Point GA4 Audits',
          'White-Label Sender Domains',
          'Unlimited Multi-Recipient Alert Lists',
          'Priority Onboarding & SLAs'
        ];

  const handlePurchase = async (tier: 'pro' | 'custom') => {
    setErrorMsg('');

    if (isSandboxMode) {
      setSandboxTier(tier);
      await refreshWorkspace();
      navigate('/onboarding?checkout=success');
      return;
    }

    setCheckoutLoading(tier);
    try {
      const token = await getToken();
      const targetProduct = tier === 'custom' ? customProduct : proProduct;
      const res = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tier,
          containers: tier === 'custom' ? containers : 10,
          productId: targetProduct?.id || undefined
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg(data.error || 'Failed to initiate Polar subscription checkout');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while initiating checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleOpenPortal = async () => {
    setErrorMsg('');
    if (isSandboxMode) {
      setErrorMsg('Customer Portal is available in live production with Polar.sh billing.');
      return;
    }
    setPortalLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/polar/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg(data?.error || 'Could not open Polar Customer Portal yet.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to connect to Polar Customer Portal');
    } finally {
      setPortalLoading(false);
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
            2. Select Package &amp; Polar Billing
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
              ? `Your organization is currently on the ${userTier.toUpperCase()} package (${workspaceLimit > 0 ? `up to ${workspaceLimit} workspaces` : 'active'}). Manage billing or launch project onboarding.`
              : 'Select a Polar.sh subscription package to unlock your Organization Dashboard, guided Project Onboarding, GTM automation, and 24/7 GA4 Observer.'}
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

        {hasActiveSubscription && (() => {
          const capacityPct = workspaceLimit > 0
            ? Math.min(100, Math.max(projects.length > 0 ? 4 : 0, Math.round((projects.length / workspaceLimit) * 100)))
            : 100;
          const remainingSlots = workspaceLimit > 0 ? Math.max(0, workspaceLimit - projects.length) : 0;

          return (
            <div className="billing-active-card">
              <div className="billing-active-top">
                <div className="billing-active-identity">
                  <div className="billing-badge-row">
                    <span className="billing-status-pill">
                      <span className="billing-status-dot" />
                      Active Subscription • Polar.sh Synced
                    </span>
                    <span className="billing-tier-pill">{userTier.toUpperCase()} Tier</span>
                  </div>
                  <h3 className="billing-active-title">
                    {userTier === 'custom'
                      ? customProduct?.name || 'GTMObserver Custom Scale Plan'
                      : proProduct?.name || 'GTMObserver Pro Plan'}
                  </h3>
                  <p className="billing-active-desc">
                    {projects.length === 0
                      ? 'No projects configured yet. Launch guided onboarding to connect GA4, GTM, and scheduled alerts.'
                      : `Managing ${projects.length} active project${projects.length === 1 ? '' : 's'} with isolated GTM deployments, GA4 audits, and cron monitors.`}
                  </p>
                </div>

                <div className="billing-capacity-box">
                  <div className="billing-capacity-header">
                    <span className="billing-capacity-label">Workspace Capacity</span>
                    <span className="billing-capacity-value">
                      {projects.length}
                      {workspaceLimit > 0 ? <span> / {workspaceLimit}</span> : <span> active</span>}
                    </span>
                  </div>
                  <div className="billing-capacity-track">
                    <div className="billing-capacity-fill" style={{ width: `${capacityPct}%` }} />
                  </div>
                  <div className="billing-capacity-note">
                    {workspaceLimit > 0
                      ? `${remainingSlots} project slot${remainingSlots === 1 ? '' : 's'} remaining in plan`
                      : 'Active workspace quota unlocked'}
                  </div>
                </div>
              </div>

              <div className="billing-active-actions">
                <Link to="/onboarding" className="billing-action-btn primary">
                  <Plus size={16} />
                  New Project
                  <ArrowRight size={15} />
                </Link>
                <button
                  type="button"
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                  className="billing-action-btn accent"
                >
                  {portalLoading ? <Loader2 size={15} className="animate-spin" /> : <ExternalLink size={15} />}
                  Manage Billing &amp; Invoices
                </button>
                <Link to="/organization" className="billing-action-btn outline">
                  <Building2 size={15} />
                  Organization Dashboard
                </Link>
              </div>
            </div>
          );
        })()}

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

        {loadingCatalog && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <Loader2 size={15} className="animate-spin" color="#00F0FF" />
            <span>Syncing live plan pricing from Polar.sh...</span>
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
                <h3>{proProduct?.name || 'Pro Organization'}</h3>
              </div>
              <div className="tier-price-display">
                {proDisplayPrice}
                <span>{proIntervalLabel}</span>
              </div>
              <p className="tier-desc">
                {proProduct?.description || 'For agencies & hospitality/e-commerce teams'}
              </p>
            </div>

            <ul className="tier-features-list">
              {proFeatures.map((feat, i) => (
                <li key={i}>
                  <Check className="feature-icon-active" size={20} /> <span>{feat}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePurchase('pro')}
              disabled={checkoutLoading !== null || (!isSandboxMode && userTier === 'pro')}
              className="checkout-btn primary"
            >
              {checkoutLoading === 'pro' ? (
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
                <h3>{customProduct?.name || 'Custom Enterprise Scale'}</h3>
              </div>
              <div className="tier-price-display">
                {isCustomVariablePrice && hasDiscount && (
                  <span style={{ textDecoration: 'line-through', fontSize: '1.25rem', color: '#6B7280', marginRight: '0.5rem' }}>
                    ${baseCustomPrice}
                  </span>
                )}
                {customDisplayPrice}
                <span>{customIntervalLabel}</span>
              </div>
              <p className="tier-desc">
                {customProduct?.description || 'Scale across 10–100+ client projects'}
                {isCustomVariablePrice && hasDiscount && (
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
              {customFeatures.map((feat, i) => (
                <li key={i}>
                  <Check className="feature-icon-active" size={20} /> <span>{feat}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePurchase('custom')}
              disabled={checkoutLoading !== null}
              className="checkout-btn outline"
            >
              {checkoutLoading === 'custom' ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isSandboxMode ? (
                `Activate Custom (${containers}) & Start Onboarding →`
              ) : userTier === 'custom' ? (
                'Update Capacity in Polar'
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
