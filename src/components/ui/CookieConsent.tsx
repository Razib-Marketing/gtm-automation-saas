// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cookie, Settings2, X, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import './CookieConsent.css';

const COOKIE_STORAGE_KEY = 'gtm_cookie_consent_v1';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    marketing: false
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!saved) {
        // Slight delay so it doesn't cause layout shift during initial paint
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (_) {
      // In case localStorage is blocked
    }
  }, []);

  const saveConsent = (prefs: typeof preferences) => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify({
        ...prefs,
        timestamp: new Date().toISOString()
      }));
    } catch (_) {}
    setIsVisible(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    saveConsent({ essential: true, analytics: true, marketing: true });
  };

  const handleEssentialOnly = () => {
    saveConsent({ essential: true, analytics: false, marketing: false });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div 
        role="region" 
        aria-label="Cookie and Privacy Consent" 
        className="cookie-consent-wrapper"
      >
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="cookie-consent-card"
        >
          <div className="cookie-consent-header">
            <div className="cookie-icon-pill">
              <Cookie size={18} className="cookie-svg" />
              <span>Privacy & Cookie Preferences</span>
            </div>
            <button 
              onClick={handleEssentialOnly} 
              aria-label="Dismiss cookie notice with essential cookies only"
              className="cookie-close-btn"
            >
              <X size={18} />
            </button>
          </div>

          <p className="cookie-consent-text">
            We use essential cookies to maintain secure edge sessions, along with optional analytics telemetry to monitor GA4 health and improve your platform experience. We respect your privacy and never sell personal data. Review our{' '}
            <Link to="/privacy-policy" className="cookie-policy-link">Privacy Policy</Link> and{' '}
            <Link to="/terms-of-service" className="cookie-policy-link">Terms</Link>.
          </p>

          <div className="cookie-consent-actions">
            <button 
              onClick={handleAcceptAll} 
              className="btn-cookie-accept"
              aria-label="Accept all cookies including analytics"
            >
              Accept All
            </button>
            <button 
              onClick={handleEssentialOnly} 
              className="btn-cookie-secondary"
              aria-label="Accept essential cookies only"
            >
              Essential Only
            </button>
            <button 
              onClick={() => setShowPreferences(prev => !prev)} 
              className="btn-cookie-prefs"
              aria-label="Customize individual cookie preferences"
              aria-expanded={showPreferences}
            >
              <Settings2 size={15} /> Customize
            </button>
          </div>

          {showPreferences && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="cookie-prefs-drawer"
            >
              <div className="cookie-pref-item">
                <div className="pref-info">
                  <strong>Essential & Authentication</strong>
                  <span>Required for secure OAuth session persistence, CSRF protection, and Cloudflare edge delivery. Cannot be disabled.</span>
                </div>
                <div className="pref-toggle disabled">
                  <Check size={14} /> Always Active
                </div>
              </div>

              <div className="cookie-pref-item">
                <div className="pref-info">
                  <strong>Telemetry & GA4 Anomaly Analytics</strong>
                  <span>Allows aggregate diagnostic telemetry to optimize background check latency and detect platform anomalies.</span>
                </div>
                <label className="pref-switch">
                  <input 
                    type="checkbox" 
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                    aria-label="Toggle Telemetry and Analytics cookies"
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="cookie-pref-footer">
                <button 
                  onClick={handleSavePreferences} 
                  className="btn-cookie-save"
                  aria-label="Save customized cookie preferences"
                >
                  Save Preferences
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
