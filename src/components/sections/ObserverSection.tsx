import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Bell, Zap, Send, CheckCircle2, 
  ArrowRight, Filter 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { pushDataLayer } from '../../utils/analytics';
import './ObserverSection.css';

export const ObserverSection: React.FC = () => {
  const { isSignedIn } = useAuth();
  return (
    <section className="observer-section" id="observer">
      <div className="observer-container">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="observer-header"
        >
          <div className="observer-badge">
            <Activity className="observer-badge-icon" size={16} />
            <span>Real-Time GA4 Anomaly Observer & Alerts</span>
          </div>
          <h2 className="observer-title">
            Never Lose Tracking Again with <br />
            <span className="observer-title-gradient">Autonomous GA4 Monitoring</span>
          </h2>
          <p className="observer-subtitle">
            Don't wait for your clients or executive team to notice broken conversion tracking or traffic crashes. 
            GA4 Observer continuously audits your properties at the Cloudflare edge, detecting anomalies and alerting your team before business revenue is impacted.
          </p>
        </motion.div>

        {/* Feature Grid / Capabilities */}
        <div className="observer-capabilities-grid">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="observer-cap-card"
          >
            <div className="observer-cap-icon" style={{ background: 'rgba(0, 240, 255, 0.1)', color: '#00F0FF', borderColor: 'rgba(0, 240, 255, 0.25)' }}>
              <Zap size={24} />
            </div>
            <h3>24/7 Automated Edge Checks</h3>
            <p>
              Runs scheduled background checks comparing baseline periods (Yesterday vs Last Week, Last 7 vs Prev 7, or Last 30 vs Prev 30) directly against Google Analytics Data API v1beta.
            </p>
            <ul className="observer-cap-list">
              <li><CheckCircle2 size={16} color="#00F0FF" /> Zero latency Cloudflare Cron triggers</li>
              <li><CheckCircle2 size={16} color="#00F0FF" /> Instant detection of broken tags & drops</li>
              <li><CheckCircle2 size={16} color="#00F0FF" /> Direct property authentication via Google OAuth</li>
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="observer-cap-card highlight"
          >
            <div className="observer-cap-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.25)' }}>
              <Filter size={24} />
            </div>
            <h3>Compound Rules & Channel Filtering</h3>
            <p>
              Combine multiple metrics with <code>ALL</code> (AND) or <code>ANY</code> (OR) condition logic. Isolate specific channels like Organic Search, Paid Ads, or Social.
            </p>
            <ul className="observer-cap-list">
              <li><CheckCircle2 size={16} color="#00F0FF" /> 1-Click Pre-made templates (Traffic Drop, Form Failure)</li>
              <li><CheckCircle2 size={16} color="#00F0FF" /> Metric support: ActiveUsers, Sessions, KeyEvents</li>
              <li><CheckCircle2 size={16} color="#00F0FF" /> Granular threshold % for Drops, Spikes & Changes</li>
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="observer-cap-card"
          >
            <div className="observer-cap-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
              <Bell size={24} />
            </div>
            <h3>Multi-Email Alerts & Dual History</h3>
            <p>
              Notify your entire team simultaneously with mobile-responsive email reports. Keep a complete audit trail separated by Automated Alerts vs Manual Reports.
            </p>
            <ul className="observer-cap-list">
              <li><CheckCircle2 size={16} color="#00F0FF" /> Add multiple client & developer recipients</li>
              <li><CheckCircle2 size={16} color="#00F0FF" /> Instant on-demand "Send Report" button</li>
              <li><CheckCircle2 size={16} color="#00F0FF" /> Dedicated Automated vs Manual report history tabs</li>
            </ul>
          </motion.div>
        </div>

        {/* Live UI Mockup Showcase */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="observer-preview-wrapper"
        >
          <div className="observer-preview-window">
            <div className="observer-window-header">
              <div className="window-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="window-title">
                <Activity size={14} color="#00F0FF" />
                <span>Observer Monitor — River Inn of Harbor Town (Active 24/7)</span>
              </div>
              <div className="window-status-tag">
                <span className="status-ping" /> Active Monitoring
              </div>
            </div>

            <div className="observer-window-body">
              <div className="preview-meta-bar">
                <div className="meta-item">
                  <span className="meta-label">Match Logic:</span>
                  <span className="meta-val">Match ANY condition (OR)</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Comparison Period:</span>
                  <span className="meta-val">yesterday vs last week</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Alert Recipients:</span>
                  <span className="meta-val">ovi@razibmarketing.net, dev@agency.com</span>
                </div>
              </div>

              {/* Sample Condition Cards */}
              <div className="preview-conditions-list">
                <div className="preview-condition-card">
                  <div className="pcond-left">
                    <div className="pcond-metric">ActiveUsers <span className="pcond-channel">[Channel: All Traffic]</span></div>
                    <div className="pcond-baseline">Baseline: 1,126 → Current: 1,333 • <span>Rule: Drops &lt; -20%</span></div>
                  </div>
                  <div className="pcond-right">
                    <span className="pcond-pct positive">+18.4%</span>
                    <span className="pcond-pill ok">✔ OK</span>
                  </div>
                </div>

                <div className="preview-condition-card">
                  <div className="pcond-left">
                    <div className="pcond-metric">KeyEvents <span className="pcond-channel">[Channel: Paid Search]</span></div>
                    <div className="pcond-baseline">Baseline: 420 → Current: 495 • <span>Rule: Drops &lt; -30%</span></div>
                  </div>
                  <div className="pcond-right">
                    <span className="pcond-pct positive">+17.9%</span>
                    <span className="pcond-pill ok">✔ OK</span>
                  </div>
                </div>

                <div className="preview-condition-card">
                  <div className="pcond-left">
                    <div className="pcond-metric">Sessions <span className="pcond-channel">[Medium: organic]</span></div>
                    <div className="pcond-baseline">Baseline: 850 → Current: 1,020 • <span>Rule: Drops &lt; -25%</span></div>
                  </div>
                  <div className="pcond-right">
                    <span className="pcond-pct positive">+20.0%</span>
                    <span className="pcond-pill ok">✔ OK</span>
                  </div>
                </div>
              </div>

              {/* Dual History Banner Preview */}
              <div className="preview-history-bar">
                <div className="preview-history-pill automated">
                  <Zap size={13} /> <span>⚡ Automated Issue Alerts (0 Incidents)</span>
                </div>
                <div className="preview-history-pill manual">
                  <Send size={13} /> <span>📤 Manual Report History (5 Delivered)</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Callout */}
        <div className="observer-cta-actions" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          {isSignedIn ? (
            <a 
              href="https://app.gtmobserver.com/observer" 
              className="btn-primary" 
              style={{ padding: '0.85rem 2rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
              onClick={() => pushDataLayer('cta_click', { cta_text: 'Open GA4 Observer', cta_location: 'observer_section' })}
            >
              Open GA4 Observer <ArrowRight size={18} style={{ marginLeft: '6px' }} />
            </a>
          ) : (
            <Link 
              to="/sign-up" 
              className="btn-primary" 
              style={{ padding: '0.85rem 2rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center' }}
              onClick={() => pushDataLayer('cta_click', { cta_text: 'Start Monitoring for Free', cta_location: 'observer_section' })}
            >
              Start Monitoring for Free <ArrowRight size={18} style={{ marginLeft: '6px' }} />
            </Link>
          )}
        </div>

      </div>
    </section>
  );
};
