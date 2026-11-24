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
            <h3>Custom-Scheduled Edge Checks</h3>
            <p>
              Set your exact preferred run time and timezone per account or monitor. Evaluates Daily, rolling/calendar Week-over-Week, Month-over-Month, and Year-over-Year comparisons via 15-minute Cloudflare cron sweeps.
            </p>
            <ul className="observer-cap-list">
              <li><CheckCircle2 size={16} color="#00F0FF" /> Custom HH:MM time &amp; IANA timezone per monitor</li>
              <li><CheckCircle2 size={16} color="#00F0FF" /> 11 periods: DoD, WoW, MoM, 28d cycles &amp; YoY</li>
              <li><CheckCircle2 size={16} color="#00F0FF" /> Timezone-aware evaluation with zero duplicate alerts</li>
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
            <h3>20 Templates, Industry &amp; Device Filters</h3>
            <p>
              Combine 14 GA4 metrics with <code>ALL</code> (AND) or <code>ANY</code> (OR) logic across 6 trigger operators, website types (including Hospitality), channels, and mobile/desktop device categories.
            </p>
            <ul className="observer-cap-list">
              <li><CheckCircle2 size={16} color="#00F0FF" /> 20 categorized templates incl. 6 Hospitality &amp; Hotels</li>
              <li><CheckCircle2 size={16} color="#00F0FF" /> Drops %, Spikes %, Outage (=0) &amp; Absolute Thresholds</li>
              <li><CheckCircle2 size={16} color="#00F0FF" /> Channel, Source/Medium &amp; Device filtering</li>
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
            <h3>22-Point GA4 Audit &amp; Multi-Email Alerts</h3>
            <p>
              Audit any project&apos;s GA4 property across cross-domain setups, self-referrals, PII leaks, and 9 Google product links (GSC, Ads, BigQuery, Signals) with one-click A4 PDF export.
            </p>
            <ul className="observer-cap-list">
              <li><CheckCircle2 size={16} color="#00F0FF" /> Built-in 22-Point GA4 Property Audit + PDF report</li>
              <li><CheckCircle2 size={16} color="#00F0FF" /> Instant on-demand &ldquo;Test &amp; Send Report&rdquo; delivery</li>
              <li><CheckCircle2 size={16} color="#00F0FF" /> Separated Automated Issue Alerts &amp; Manual History</li>
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

        {/* CTA Actions (Pricing tier summary temporarily hidden) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="observer-cta-actions"
          style={{ borderTop: 'none', paddingTop: '0.5rem' }}
        >
          {isSignedIn ? (
            <a 
              href="https://app.gtmobserver.com/organization" 
              className="btn-primary" 
              style={{ padding: '0.85rem 2rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
              onClick={() => pushDataLayer('cta_click', { cta_text: 'Open GA4 Observer', cta_location: 'observer_section' })}
            >
              Open Organization &amp; Observer <ArrowRight size={18} style={{ marginLeft: '6px' }} />
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
        </motion.div>

      </div>
    </section>
  );
};
