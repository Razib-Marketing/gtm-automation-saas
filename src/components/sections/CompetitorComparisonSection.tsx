// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Shield, AlertTriangle } from 'lucide-react';
import './CompetitorComparisonSection.css';

export const CompetitorComparisonSection: React.FC = () => {
  const comparisonData = [
    {
      feature: "Automated GTM Workspace Deployment",
      gtmObserver: true,
      manualTagging: false,
      uptimeMonitors: false,
      enterpriseSuites: false,
      detail: "1-click injection of tags, triggers, and variables into containers"
    },
    {
      feature: "Continuous GA4 Telemetry Audits",
      gtmObserver: true,
      manualTagging: false,
      uptimeMonitors: false,
      enterpriseSuites: true,
      detail: "Monitors actual event volume, conversion counts, and session metrics"
    },
    {
      feature: "Catches Broken Event Listeners",
      gtmObserver: true,
      manualTagging: false,
      uptimeMonitors: false,
      enterpriseSuites: true,
      detail: "Detects when checkout, form, or booking buttons stop firing dataLayer events"
    },
    {
      feature: "Serverless Edge Execution (Sub-50ms)",
      gtmObserver: true,
      manualTagging: false,
      uptimeMonitors: true,
      enterpriseSuites: false,
      detail: "Zero infrastructure maintenance, powered by Cloudflare Workers"
    },
    {
      feature: "Setup Time",
      gtmObserver: "Under 2 Minutes",
      manualTagging: "10–25+ Hours",
      uptimeMonitors: "5 Minutes",
      enterpriseSuites: "2–4 Weeks",
      detail: "Instant Google OAuth authorization with automatic account discovery"
    },
    {
      feature: "Flexible Plans",
      gtmObserver: "Self-Service & Agency Plans",
      manualTagging: "Expensive Billable Hours",
      uptimeMonitors: "$15–$50/mo (No GA4 value)",
      enterpriseSuites: "$1,000–$5,000+/mo",
      detail: "No hidden onboarding fees, lengthy sales demos, or annual lock-ins"
    }
  ];

  return (
    <section className="comparison-section" id="comparison" aria-labelledby="comparison-title">
      <div className="comparison-container">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="comparison-header"
        >
          <div className="section-pill">
            <Sparkles size={14} />
            <span>Why GTMObserver Beats The Alternatives</span>
          </div>
          <h2 id="comparison-title" className="section-title">
            Stop Relying on Guesswork & Outdated Tools <br />
            <span className="title-highlight">Engineered for Modern Analytics Teams</span>
          </h2>
          <p className="section-subtitle">
            Most brands don't know their conversion tracking is broken until monthly reports show zero revenue. See how GTMObserver protects your data integrity.
          </p>
        </motion.div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table" role="table" aria-label="Feature comparison between GTMObserver and alternatives">
            <thead>
              <tr>
                <th scope="col" className="th-feature">Capability</th>
                <th scope="col" className="th-gtm highlight-col">GTMObserver</th>
                <th scope="col" className="th-comp">Manual Setup</th>
                <th scope="col" className="th-comp">Uptime Checkers (Pingdom)</th>
                <th scope="col" className="th-comp">Legacy Suites (ObservePoint)</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, idx) => (
                <tr key={idx}>
                  <th scope="row" className="td-feature">
                    <span className="feature-name">{row.feature}</span>
                    <span className="feature-detail">{row.detail}</span>
                  </th>
                  <td className="td-val highlight-col">
                    {typeof row.gtmObserver === 'boolean' ? (
                      row.gtmObserver ? <span className="val-badge green"><Check size={18} /> Yes</span> : <X size={18} className="icon-red" />
                    ) : (
                      <span className="val-text-gtm">{row.gtmObserver}</span>
                    )}
                  </td>
                  <td className="td-val">
                    {typeof row.manualTagging === 'boolean' ? (
                      row.manualTagging ? <Check size={18} className="icon-green" /> : <X size={18} className="icon-red" />
                    ) : (
                      <span className="val-text">{row.manualTagging}</span>
                    )}
                  </td>
                  <td className="td-val">
                    {typeof row.uptimeMonitors === 'boolean' ? (
                      row.uptimeMonitors ? <Check size={18} className="icon-green" /> : <X size={18} className="icon-red" />
                    ) : (
                      <span className="val-text">{row.uptimeMonitors}</span>
                    )}
                  </td>
                  <td className="td-val">
                    {typeof row.enterpriseSuites === 'boolean' ? (
                      row.enterpriseSuites ? <Check size={18} className="icon-green" /> : <X size={18} className="icon-red" />
                    ) : (
                      <span className="val-text">{row.enterpriseSuites}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
};
