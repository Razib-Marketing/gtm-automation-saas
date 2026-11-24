// @ts-nocheck
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Code, 
  FileText, 
  Bell, 
  Layers, 
  Cpu, 
  TrendingUp, 
  Users 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import './AboutPlatformSection.css';

export const AboutPlatformSection: React.FC = () => {
  const { isSignedIn } = useAuth();

  const capabilities = [
    {
      badge: "Organization & GTM",
      badgeColor: "#00F0FF",
      title: "Project Workspaces & 1-Click GTM Automation",
      subtitle: "Organize every client inside isolated project workspaces and deploy validated GTM architectures via API in seconds.",
      icon: <Zap size={26} color="#00F0FF" />,
      features: [
        "Dedicated Organization Dashboard with strict project-by-project workspace isolation",
        "Pre-built recipes: Form suites, Outbound/Phone/OTA clicks, WooCommerce & 6 Hotel Booking Engines",
        "Guided Onboarding Wizard to name projects, bind GA4 + GTM, and set initial rules",
        "Workspace safe: Never overwrites your existing custom tags, triggers, or variables"
      ],
      result: "Saves 3–5 hours per project setup while keeping every client isolated cleanly."
    },
    {
      badge: "Dual Diagnostics",
      badgeColor: "#A855F7",
      title: "GTM & 22-Point GA4 Property Audits",
      subtitle: "Deep forensic container and GA4 property auditing with 0–100% health scoring and downloadable A4 PDF reports.",
      icon: <Activity size={26} color="#C084FC" />,
      features: [
        "22-Point GA4 Property Audit: cross-domain gaps, self-referrals, and 9 product links (GSC, Ads, BigQuery, Signals)",
        "Automatic PII leak scanning in GA4 page URLs with masked forensics and remediation steps",
        "GTM Workspace scanning to catch duplicate conversion tags, shared triggers, and orphaned variables",
        "Executive A4 PDF export buttons built into both GTM and GA4 audit reports"
      ],
      result: "Catch silent attribution leaks, missing GSC/Ads links, and broken GTM tags in seconds."
    },
    {
      badge: "24/7 Monitoring",
      badgeColor: "#38BDF8",
      title: "Autonomous GA4 Telemetry & Custom Alerts",
      subtitle: "Edge-native monitoring running at Cloudflare Workers on your chosen schedule, timezone, and industry perspective.",
      icon: <Bell size={26} color="#38BDF8" />,
      features: [
        "Per-account and per-monitor custom schedules (HH:MM, IANA timezone, Daily/Weekly/Monthly) via 15-min edge cron",
        "20 categorized rule templates (incl. Hospitality & Hotels), 14 metrics, 6 operators, and device/channel filters",
        "11 comparison periods: Yesterday, rolling & calendar WoW, MoM, 28d cycles, and YoY",
        "Instant multi-recipient Resend email alerts + Dual History for Automated vs Manual checks"
      ],
      result: "Protects your ad spend & conversion signals before clients notice tracking drops."
    }
  ];

  const targetAudiences = [
    {
      title: "Marketing & Analytics Agencies",
      description: "Manage tracking across dozens of client accounts. Audit client GTM containers in 10 seconds during onboarding and deploy standard modules with a click."
    },
    {
      title: "E-Commerce Brands & Founders",
      description: "Ensure purchase and add-to-cart conversion data never silently breaks after a theme update or plugin conflict, safeguarding Meta and Google ad ROAS."
    },
    {
      title: "Freelancers & Growth Engineers",
      description: "Deliver enterprise-grade tracking setups in minutes rather than spending entire afternoons writing custom JavaScript and debugging GTM preview mode."
    }
  ];

  return (
    <section className="about-platform-section" id="about" aria-labelledby="about-platform-title">
      <div className="about-platform-container">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="about-platform-header"
        >
          <div className="section-pill">
            <Layers size={14} />
            <span>Platform Overview & Capabilities</span>
          </div>
          <h2 id="about-platform-title" className="section-title">
            What is GTMObserver? <br />
            <span className="title-highlight">Your Autonomous Tracking & Telemetry Hub</span>
          </h2>
          <p className="section-subtitle">
            GTMObserver is an edge-native cloud platform built to automate Google Tag Manager setups, 
            audit container health, and continuously monitor Google Analytics 4 pipelines for tracking anomalies.
          </p>
        </motion.div>

        {/* 3 Core Capabilities Grid */}
        <div className="capabilities-grid">
          {capabilities.map((cap, idx) => (
            <motion.div 
              key={cap.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.15 }}
              className="capability-card"
            >
              <div className="capability-top">
                <div className="capability-icon-wrap" style={{ borderColor: `${cap.badgeColor}33`, background: `${cap.badgeColor}15` }}>
                  {cap.icon}
                </div>
                <span className="capability-badge" style={{ color: cap.badgeColor, background: `${cap.badgeColor}15`, borderColor: `${cap.badgeColor}33` }}>
                  {cap.badge}
                </span>
              </div>

              <h3 className="capability-title">{cap.title}</h3>
              <p className="capability-subtitle">{cap.subtitle}</p>

              <ul className="capability-features">
                {cap.features.map((feat, fIdx) => (
                  <li key={fIdx}>
                    <CheckCircle2 size={16} color={cap.badgeColor} className="feat-check" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="capability-result">
                <strong>Outcome:</strong> {cap.result}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Who It's Built For */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="audiences-wrapper"
        >
          <div className="audiences-header">
            <Users size={20} color="#00F0FF" />
            <h3>Built for Teams That Rely on Flawless Tracking</h3>
          </div>
          
          <div className="audiences-grid">
            {targetAudiences.map((aud, i) => (
              <div key={i} className="audience-item">
                <h4>{aud.title}</h4>
                <p>{aud.description}</p>
              </div>
            ))}
          </div>

          <div className="about-cta-bar">
            {isSignedIn ? (
              <a href="https://app.gtmobserver.com/organization" className="btn-primary" style={{ textDecoration: 'none' }}>
                Open Organization Dashboard <ArrowRight size={16} />
              </a>
            ) : (
              <Link to="/sign-up" className="btn-primary" style={{ textDecoration: 'none' }}>
                Start with 5 Free GTM Audits <ArrowRight size={16} />
              </Link>
            )}
            <a href="mailto:info@gtmobserver.com" className="btn-secondary" style={{ textDecoration: 'none' }}>
              Speak with Integration Team
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
