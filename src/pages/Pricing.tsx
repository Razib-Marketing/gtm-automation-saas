import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Check, X, Shield, Sparkles, Loader2 } from 'lucide-react';
import { pushDataLayer } from '../utils/analytics';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Pricing.css';

export default function Pricing() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [containers, setContainers] = useState(10);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [currentTier, setCurrentTier] = useState('free');

  useEffect(() => {
    pushDataLayer('view_item_list', {
      ecommerce: {
        item_list_id: 'pricing_plans',
        item_list_name: 'Subscription Plans',
        items: [
          { item_id: 'plan_pro', item_name: 'GTMObserver Pro Tier', price: 149, item_category: 'Subscription', quantity: 1 },
          { item_id: 'plan_custom', item_name: 'GTMObserver Custom Tier', price: 149, item_category: 'Subscription', quantity: 1 }
        ]
      }
    });
  }, []);

  useEffect(() => {
    if (user && isSignedIn) {
      getToken()
        .then(token => {
          if (!token) return null;
          return fetch(`/api/user/me?email=${encodeURIComponent(user.primaryEmailAddress?.emailAddress || '')}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => res.json());
        })
        .then(data => {
          if (data) setCurrentTier(data.subscription_tier || 'free');
        })
        .catch(() => {});
    }
  }, [user, isSignedIn, getToken]);

  const handleCheckout = async (tier: 'pro' | 'custom') => {
    const checkoutPrice = tier === 'custom' ? customPrice : 149;
    pushDataLayer('begin_checkout', {
      ecommerce: {
        currency: 'USD',
        value: checkoutPrice,
        items: [
          {
            item_id: tier === 'custom' ? 'plan_custom' : 'plan_pro',
            item_name: tier === 'custom' ? `GTMObserver Custom Tier (${containers} Containers)` : 'GTMObserver Pro Tier',
            item_category: 'Subscription',
            price: checkoutPrice,
            quantity: 1
          }
        ]
      },
      tier,
      containers: tier === 'custom' ? containers : 10,
      price: checkoutPrice,
      currency: 'USD'
    });

    if (!isSignedIn) {
      window.location.href = `/sign-up?redirect_url=${encodeURIComponent('/pricing')}`;
      return;
    }
    setCheckoutLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ tier, containers })
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

  const baseCustomPrice = Math.max(149, Math.ceil(containers * 14.9)); // 10 GTM Accounts = $149
  const hasDiscount = containers >= 15;
  const customPrice = hasDiscount ? Math.floor(baseCustomPrice * 0.9) : baseCustomPrice;

  return (
    <PageTransition locationKey="pricing">
      <BackgroundMesh />

      <div className="pricing-page">
        <div className="pricing-header-text">
          <h1>Simple, Transparent Pricing</h1>
          <p>
            Automate your Google Tag Manager deployments and monitor GA4 properties for anomalies at any scale. Upgrade to unlock multi-account deployments and advanced incident observer rules.
          </p>
        </div>

        <div className="pricing-grid-container">
          {/* Free Tier */}
          <div className="pricing-card-box">
            {isSignedIn && currentTier === 'free' && (
              <div className="current-plan-badge" style={{ background: 'linear-gradient(135deg, #4F46E5, #00F0FF)', boxShadow: '0 4px 15px rgba(0, 240, 255, 0.4)', color: 'white', border: 'none' }}>
                Current Plan
              </div>
            )}
            <div className="tier-title-container">
              <h3 className="tier-title-header">Free</h3>
              <div className="tier-price-display">$0<span>/mo</span></div>
              <p className="tier-desc">Perfect for testing the waters</p>
            </div>
            
            <ul className="tier-features-list">
              <li><Check className="feature-icon-active" size={20} /> <span>Deploy Base GA4 Config</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Basic Full Tracking Access</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>1 GTM Account Limit</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>1 GA4 Observer Active Monitor</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Daily Anomaly Health Checks</span></li>
              <li className="disabled"><X className="feature-icon-disabled" size={20} /> <span>Multi-Email Anomaly Alerts</span></li>
              <li className="disabled"><X className="feature-icon-disabled" size={20} /> <span>Premium Tracking Modules</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>5 GTM Workspace Audits</span></li>
            </ul>
            
            {isSignedIn ? (
              <button className="checkout-btn muted" disabled={currentTier === 'free'}>
                {currentTier === 'free' ? 'Active' : 'Downgrade'}
              </button>
            ) : (
              <Link to="/sign-up" className="checkout-btn muted" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                Get Started Free
              </Link>
            )}
          </div>

          {/* Pro Tier */}
          <div className="pricing-card-box active-tier">
            {isSignedIn && currentTier === 'pro' ? (
              <div className="current-plan-badge" style={{ background: 'linear-gradient(135deg, #4F46E5, #00F0FF)', boxShadow: '0 4px 15px rgba(0, 240, 255, 0.4)', color: 'white', border: 'none' }}>
                Current Plan
              </div>
            ) : (
              <div className="current-plan-badge">Most Popular</div>
            )}
            <div className="tier-title-container">
              <div className="tier-title-header">
                <Sparkles size={20} className="feature-icon-active" />
                <h3>Pro</h3>
              </div>
              <div className="tier-price-display">$149<span>/mo</span></div>
              <p className="tier-desc">For freelancers and small agencies</p>
            </div>
            
            <ul className="tier-features-list">
              <li><Check className="feature-icon-active" size={20} /> <span>All Free Features</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Up to 10 Isolated Client Projects</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Unlimited GTM Module Deployments</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Up to 10 GA4 Observer Monitors</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>22-Point GA4 Property Audits + PDF Export</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Custom Schedules, WoW/MoM/YoY &amp; Hospitality Templates</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Compound Rules (AND / OR) &amp; Device Filters</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Multi-Email Alerts &amp; Unlimited GTM Audits</span></li>
            </ul>
            
            <button 
              onClick={() => handleCheckout('pro')}
              disabled={checkoutLoading || (isSignedIn && currentTier === 'pro')}
              className="checkout-btn primary"
            >
              {checkoutLoading ? <Loader2 className="animate-spin" size={20} /> : isSignedIn && currentTier === 'pro' ? 'Active Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Custom Tier */}
          <div className="pricing-card-box">
            {isSignedIn && currentTier === 'custom' && (
              <div className="current-plan-badge" style={{ background: 'linear-gradient(135deg, #4F46E5, #00F0FF)', boxShadow: '0 4px 15px rgba(0, 240, 255, 0.4)', color: 'white', border: 'none' }}>
                Current Plan
              </div>
            )}
            <div className="tier-title-container">
              <div className="tier-title-header">
                <Shield size={20} className="feature-icon-active" />
                <h3>Custom</h3>
              </div>
              <div className="tier-price-display">
                {hasDiscount && <span style={{ textDecoration: 'line-through', fontSize: '1.25rem', color: '#6B7280', marginRight: '0.5rem' }}>${baseCustomPrice}</span>}
                ${customPrice}<span>/mo</span>
              </div>
              <p className="tier-desc">
                Scale to any number of clients
                {hasDiscount && <span style={{ display: 'block', color: '#10B981', fontWeight: 600, marginTop: '0.25rem', fontSize: '0.875rem' }}>10% Volume Discount Applied!</span>}
              </p>
            </div>

            <div className="slider-container">
              <label className="slider-label">Number of GTM Accounts & Monitors: <span>{containers}</span></label>
              <input 
                type="range" 
                min="10" max="100" step="1" 
                value={containers} 
                onChange={(e) => setContainers(parseInt(e.target.value))}
                className="custom-range"
              />
            </div>
            
            <ul className="tier-features-list">
              <li><Check className="feature-icon-active" size={20} /> <span>Unlimited Premium Modules</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>{containers} GTM Accounts & GA4 Monitors</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Custom White-Label Sender Domains</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Unlimited Multi-Recipient Alerts</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Unlimited GTM Workspace Audits</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Priority Support & Dedicated SLAs</span></li>
            </ul>
            
            <button 
              onClick={() => handleCheckout('custom')}
              disabled={checkoutLoading}
              className="checkout-btn outline"
            >
              {checkoutLoading ? <Loader2 className="animate-spin" size={20} /> : isSignedIn && currentTier === 'custom' ? 'Update Limits' : 'Contact Sales / Upgrade'}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
