import { useState, useEffect } from 'react';
import { useAuth, useUser, RedirectToSignIn } from '@clerk/clerk-react';
import { Check, X, Shield, Sparkles, Loader2 } from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Pricing.css';

export default function Pricing() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [containers, setContainers] = useState(10);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [currentTier, setCurrentTier] = useState('free');

  useEffect(() => {
    if (user) {
      fetch(`/api/user/me?clerkUserId=${user.id}&email=${encodeURIComponent(user.primaryEmailAddress?.emailAddress || '')}`)
        .then(res => res.json())
        .then(data => setCurrentTier(data.subscription_tier || 'free'));
    }
  }, [user]);

  const handleCheckout = async (tier: 'pro' | 'custom') => {
    setCheckoutLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/stripe/checkout', {
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
    } catch (err) {
      alert('Error connecting to checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

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
            Automate your Google Tag Manager deployments at any scale. Upgrade to unlock premium tags and multi-account deployments.
          </p>
        </div>

        <div className="pricing-grid-container">
          {/* Free Tier */}
          <div className="pricing-card-box">
            {currentTier === 'free' && <div className="current-plan-badge" style={{ background: 'linear-gradient(135deg, #4F46E5, #00F0FF)', boxShadow: '0 4px 15px rgba(0, 240, 255, 0.4)', color: 'white', border: 'none' }}>Current Plan</div>}
            <div className="tier-title-container">
              <h3 className="tier-title-header">Free</h3>
              <div className="tier-price-display">$0<span>/mo</span></div>
              <p className="tier-desc">Perfect for testing the waters</p>
            </div>
            
            <ul className="tier-features-list">
              <li><Check className="feature-icon-active" size={20} /> <span>Deploy Base GA4 Config</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Basic Full Tracking Access</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>1 GTM Account Limit</span></li>
              <li className="disabled"><X className="feature-icon-disabled" size={20} /> <span>Premium Tracking Modules</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>5 GTM Workspace Audits</span></li>
            </ul>
            
            <button className="checkout-btn muted" disabled>
              {currentTier === 'free' ? 'Active' : 'Downgrade'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="pricing-card-box active-tier">
            {currentTier === 'pro' ? (
              <div className="current-plan-badge" style={{ background: 'linear-gradient(135deg, #4F46E5, #00F0FF)', boxShadow: '0 4px 15px rgba(0, 240, 255, 0.4)', color: 'white', border: 'none' }}>Current Plan</div>
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
              <li><Check className="feature-icon-active" size={20} /> <span>Unlimited Module Deployments</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Up to 10 GTM Workspaces</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Unlimited GTM Workspace Audits</span></li>
            </ul>
            
            <button 
              onClick={() => handleCheckout('pro')}
              disabled={checkoutLoading || currentTier === 'pro'}
              className="checkout-btn primary"
            >
              {checkoutLoading ? <Loader2 className="animate-spin" size={20} /> : currentTier === 'pro' ? 'Active Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Custom Tier */}
          <div className="pricing-card-box">
            {currentTier === 'custom' && <div className="current-plan-badge" style={{ background: 'linear-gradient(135deg, #4F46E5, #00F0FF)', boxShadow: '0 4px 15px rgba(0, 240, 255, 0.4)', color: 'white', border: 'none' }}>Current Plan</div>}
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
              <label className="slider-label">Number of GTM Accounts: <span>{containers}</span></label>
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
              <li><Check className="feature-icon-active" size={20} /> <span>{containers} GTM Accounts</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Unlimited GTM Workspace Audits</span></li>
              <li><Check className="feature-icon-active" size={20} /> <span>Priority Support</span></li>
            </ul>
            
            <button 
              onClick={() => handleCheckout('custom')}
              disabled={checkoutLoading}
              className="checkout-btn outline"
            >
              {checkoutLoading ? <Loader2 className="animate-spin" size={20} /> : currentTier === 'custom' ? 'Update Limits' : 'Contact Sales / Upgrade'}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
