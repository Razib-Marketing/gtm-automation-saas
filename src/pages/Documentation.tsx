// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  Compass,
  Code2,
  ShieldCheck,
  Activity,
  BarChart3,
  CreditCard,
  Wrench,
  FileSearch,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Documentation.css';

export const Documentation: React.FC = () => {
  const [tocOpen, setTocOpen] = useState(false);

  const tocItems = [
    { href: '#architecture', label: '1. Organization & Project Structure', icon: Layers },
    { href: '#onboarding', label: '2. Billing & Project Onboarding', icon: Compass },
    { href: '#gtm-recipes', label: '3. GTM Automation Recipes', icon: Code2 },
    { href: '#gtm-audit', label: '4. GTM Workspace Audit & PDF', icon: ShieldCheck },
    { href: '#ga4-observer', label: '5. GA4 Observer & Schedules', icon: Activity },
    { href: '#ga4-audit', label: '6. 22-Point GA4 Property Audit', icon: FileSearch },
    { href: '#project-analytics', label: '7. Project Analytics & Settings', icon: BarChart3 },
    { href: '#plans-quotas', label: '8. Plans, Limits & Billing', icon: CreditCard },
    { href: '#troubleshooting', label: '9. Troubleshooting & Support', icon: Wrench }
  ];

  return (
    <PageTransition locationKey="docs">
      <BackgroundMesh />
      <div className="docs-page">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="docs-hero"
        >
          <div className="docs-hero-badge">
            <BookOpen size={14} />
            <span>Platform Documentation &amp; User Guide</span>
          </div>
          <h1>GTMObserver Documentation</h1>
          <p>
            Complete technical and product reference covering Organization &amp; Project workspaces, billing and guided project onboarding, 1-click Google Tag Manager automation recipes, GTM workspace audits, autonomous GA4 Observer monitoring, and the 22-point GA4 Property Audit.
          </p>
        </motion.header>

        <div className="docs-layout">
          {/* Sticky Desktop / Collapsible Mobile Table of Contents */}
          <aside className="docs-toc" aria-label="Documentation Table of Contents">
            <div className="docs-toc-desktop-title">On This Page</div>
            <button
              type="button"
              className="docs-toc-toggle"
              onClick={() => setTocOpen((prev) => !prev)}
              aria-expanded={tocOpen}
              aria-controls="docs-toc-nav"
            >
              <span>On This Page (9 Sections)</span>
              {tocOpen ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
            </button>
            <div id="docs-toc-nav" className={`docs-toc-body ${tocOpen ? 'expanded' : 'collapsed'}`}>
              <nav className="docs-toc-list">
                {tocItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className="docs-toc-link"
                      onClick={() => setTocOpen(false)}
                    >
                      <Icon size={14} style={{ flexShrink: 0, color: '#00F0FF' }} aria-hidden="true" />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </nav>
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link to="/api-reference" style={{ color: '#00F0FF', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
                  API Reference &rarr;
                </Link>
                <Link to="/pricing" style={{ color: '#CBD5E1', fontSize: '0.82rem', textDecoration: 'none' }}>
                  View Plans &amp; Pricing &rarr;
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Documentation Sections */}
          <div className="docs-main">
            {/* 1. Architecture */}
            <section id="architecture" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Layers size={20} /></div>
                <h2>1. Organization &amp; Project-Level Architecture</h2>
              </div>
              <p>
                GTMObserver strictly separates <strong>Organization-Level</strong> management from <strong>Project-Level</strong> execution so multi-brand businesses and agencies never accidentally deploy tags or evaluate metrics across the wrong client account.
              </p>

              <div className="docs-flow-strip" aria-label="End-to-End Platform User Flow">
                <span className="docs-flow-node">Account Creation</span>
                <span className="docs-flow-arrow">&rarr;</span>
                <span className="docs-flow-node">Billing &amp; Plan Purchase</span>
                <span className="docs-flow-arrow">&rarr;</span>
                <span className="docs-flow-node">Project Onboarding</span>
                <span className="docs-flow-arrow">&rarr;</span>
                <span className="docs-flow-node">Organization Dashboard</span>
                <span className="docs-flow-arrow">&rarr;</span>
                <span className="docs-flow-node">Select Project Workspace</span>
              </div>

              <div className="docs-grid-2">
                <div className="docs-mini-box">
                  <h4>Organization Level (/organization)</h4>
                  <p>
                    Displays every project in your organization as separate cards with linked GTM Container IDs, GA4 Properties, active monitor counts, and latest GTM/GA4 audit scores. Includes Organization navigation: <em>Organization, New Project, Billing &amp; Plan, Org Settings</em>.
                  </p>
                </div>
                <div className="docs-mini-box">
                  <h4>Project Workspace (/projects/:projectId/*)</h4>
                  <p>
                    Selecting a project switches the sidebar and workspace strictly into Project Mode (with a <code>&larr; All Projects</code> switcher). Inside a project workspace, you only see data, monitors, alerts, GTM bindings, and audits belonging to that project.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Billing & Onboarding */}
            <section id="onboarding" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Compass size={20} /></div>
                <h2>2. Account Creation, Billing Gate &amp; Project Onboarding</h2>
              </div>
              <h3>Subscription Verification</h3>
              <p>
                When a user signs up or signs into GTMObserver, the platform checks whether their organization holds an active paid subscription package (<code>pro</code> or <code>custom</code>). Unsubscribed accounts are routed directly to the in-app <strong>Billing</strong> screen (<code>/billing</code>) to choose a package via Polar checkout. Once checkout completes, users proceed automatically to <code>/onboarding?checkout=success</code>.
              </p>

              <h3>4-Step Guided Project Setup Wizard (/onboarding)</h3>
              <ol>
                <li>
                  <strong>Project Details:</strong> Set the project name, website domain, and industry perspective (<code>General</code>, <code>Hospitality &amp; Hotels</code>, <code>E-Commerce</code>, <code>Lead Generation</code>, <code>SaaS</code>, or <code>Content &amp; Media</code>).
                </li>
                <li>
                  <strong>Connect Google Analytics (GA4):</strong> Authorize Google OAuth2 (using <code>analytics.readonly</code>, <code>tagmanager.readonly</code>, and <code>tagmanager.edit.containers</code> scopes) and select the target GA4 Property.
                </li>
                <li>
                  <strong>Connect Google Tag Manager (GTM):</strong> Bind the corresponding GTM Account, Container, Workspace, and optional GA4 Measurement ID (<code>G-XXXXXXXXXX</code>).
                </li>
                <li>
                  <strong>Configure Triggers &amp; Observer Rules:</strong> Pick industry-matched starter GA4 Observer templates or compose custom rules, configure evaluation time/timezone and recipient emails, review configuration, and click <strong>Create Project</strong> to land on the Organization Dashboard.
                </li>
              </ol>
            </section>

            {/* 3. GTM Recipes */}
            <section id="gtm-recipes" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Code2 size={20} /></div>
                <h2>3. GTM Automation &amp; Tracking Recipe Library</h2>
              </div>
              <p>
                Inside any Project Workspace under <strong>GTM Automation &amp; Audit</strong>, your project&apos;s linked GTM Account, Container, and Workspace are pre-bound. Before injecting tags, use <strong>Verify GA4 Config</strong> to ensure a base Google Tag (<code>G-XXXXXXXXXX</code>) exists, then select recipes across these supported categories:
              </p>

              <div className="docs-table-wrap" tabIndex={0} role="region" aria-label="Documentation Reference Table">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Supported Modules &amp; Triggers</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Basic &amp; Outbound Clicks</strong></td>
                      <td>
                        Phone (<code>tel:</code>), Email (<code>mailto:</code>), Facebook, Instagram, Google My Business (GMB), Apple Maps/Waze Directions, TripAdvisor, Booking.com, Expedia, Agoda, and Generic External Outbound Links.
                      </td>
                    </tr>
                    <tr>
                      <td><strong>General Engagement</strong></td>
                      <td>
                        Universal Social Tracking (Facebook, LinkedIn, Twitter/X, etc.), Advanced Scroll Depth (25%, 50%, 75%, 90%), and YouTube/Vimeo Video Engagement (play, pause, complete).
                      </td>
                    </tr>
                    <tr>
                      <td><strong>E-Commerce</strong></td>
                      <td>
                        WooCommerce Standard GA4 E-Commerce suite (<code>view_item</code>, <code>add_to_cart</code>, checkout funnel, and <code>purchase</code> dataLayer events).
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Forms (WordPress, CRM &amp; Hospitality)</strong></td>
                      <td>
                        Elementor Forms, Contact Form 7, Gravity Forms, HubSpot Forms, Salesforce Forms, Revinate Forms, Zmail Direct Newsletter iframes, Generic HTML Forms, and Custom PHP (<code>sendmail.php</code>) forms — each configurable for <em>Wedding RFP, Event RFP, Newsletter, Contact, or Generic</em> intents.
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Hotel Booking Engines</strong></td>
                      <td>
                        Full Standard E-Commerce + Booking Entrance link tracking for <strong>StayNTouch</strong>, <strong>Synxis/SBE</strong>, <strong>Windsurfers</strong>, <strong>Mews</strong>, <strong>iHotelier</strong>, and <strong>Safara</strong>.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="docs-callout">
                <strong>Safe Non-Destructive Deployment:</strong> GTMObserver skips tags, triggers, or variables that already exist with identical names in your workspace and optionally injects optional Meta Pixel / Google Ads conversion tags alongside GA4 events.
              </div>
            </section>

            {/* 4. GTM Workspace Audit */}
            <section id="gtm-audit" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><ShieldCheck size={20} /></div>
                <h2>4. GTM Workspace Health Audit &amp; PDF Reports</h2>
              </div>
              <p>
                Click <strong>Run Audit</strong> inside your project&apos;s GTM Automation view to scan all Tags, Triggers, and Variables in the project&apos;s linked GTM workspace:
              </p>
              <ul>
                <li><strong>Duplicate Tags Detected (Critical, −20 pts):</strong> Flags multiple tags of the same type firing on the same trigger (which double-count conversions).</li>
                <li><strong>Shared Trigger Notice (Moderate, −5 pts):</strong> Highlights triggers shared across multiple distinct tags for verification.</li>
                <li><strong>Orphaned Triggers &amp; Variables (Moderate, −5 pts):</strong> Identifies unattached triggers or unreferenced variables bloating container size.</li>
                <li><strong>A4 PDF Export &amp; Scoped History:</strong> Download a branded A4 PDF report for stakeholders. Past GTM audits are stored per project in Cloudflare D1.</li>
              </ul>
            </section>

            {/* 5. GA4 Observer */}
            <section id="ga4-observer" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Activity size={20} /></div>
                <h2>5. GA4 Observer — Schedules, Templates &amp; Alerts</h2>
              </div>
              <p>
                GA4 Observer continuously evaluates live metrics via the Google Analytics Data API <code>v1beta:runReport</code> from Cloudflare Workers edge cron jobs.
              </p>

              <h3>Custom Evaluation Schedules &amp; Timezones</h3>
              <ul>
                <li><strong>15-Minute Edge Sweep:</strong> Cloudflare Cron triggers every 15 minutes (<code>*/15 * * * *</code>) and evaluates monitors whose local target window (<code>schedule_time</code> in <code>schedule_timezone</code> IANA timezone) has opened.</li>
                <li><strong>Duplicate Prevention:</strong> Each monitor tracks <code>last_run_local_date</code> so each scheduled day/week/month triggers at most one alert evaluation.</li>
                <li><strong>Per-Account Defaults &amp; Monitor Overrides:</strong> Set an account-wide default schedule in Org Settings or directly inside Observer, or customize <code>Daily</code>, <code>Weekly (Mon)</code>, or <code>Monthly (1st)</code> timing per monitor.</li>
              </ul>

              <h3>Supported Metrics, Operators, Templates &amp; Windows</h3>
              <div className="docs-grid-2">
                <div className="docs-mini-box">
                  <h4>14 GA4 Metrics &amp; 6 Operators</h4>
                  <p>
                    Monitor <code>sessions</code>, <code>activeUsers</code>, <code>totalUsers</code>, <code>newUsers</code>, <code>engagementRate</code>, <code>bounceRate</code>, <code>averageSessionDuration</code>, <code>keyEvents</code>, <code>transactions</code>, <code>totalRevenue</code>, <code>ecommercePurchases</code>, <code>sessionKeyEventRate</code>, <code>screenPageViews</code>, and <code>eventCount</code> using <strong>Drops %</strong>, <strong>Spikes %</strong>, <strong>Changes ±%</strong>, <strong>Equals 0 (Outage)</strong>, <strong>Falls Under Value</strong>, or <strong>Exceeds Value</strong>.
                  </p>
                </div>
                <div className="docs-mini-box">
                  <h4>20 Templates &amp; 11 Comparison Windows</h4>
                  <p>
                    Choose templates across 6 categories (including 6 specialized <strong>Hospitality &amp; Hotels</strong> presets) and compare across <em>Yesterday vs Last Week, Day over Day, Rolling/Calendar WoW, Calendar/Rolling MoM, 28-Day Cycle, YoY 7d, YoY 30d, YoY Calendar Month, and YoY Single Day</em>.
                  </p>
                </div>
              </div>

              <ul>
                <li><strong>Compound &amp; Segmented Filtering:</strong> Combine multiple conditions with <code>ANY (OR)</code> or <code>ALL (AND)</code> logic, scoped by Channel/Source, Medium, and <code>deviceCategory</code> (Desktop, Mobile, Tablet).</li>
                <li><strong>On-Demand Testing &amp; Dual History:</strong> Use <strong>Test &amp; Send Report</strong> to evaluate rules live via Data API and dispatch an HTML report via Resend immediately. Historical dispatches are separated cleanly into <em>Automated Issue Alerts</em> and <em>Manual Report History</em>.</li>
              </ul>
            </section>

            {/* 6. 22-Point GA4 Property Audit */}
            <section id="ga4-audit" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><FileSearch size={20} /></div>
                <h2>6. 22-Point GA4 Property Audit &amp; PDF Report</h2>
              </div>
              <p>
                Directly inside every project&apos;s <strong>GA4 Observer &amp; Audit</strong> page, click <strong>Run GA4 Audit</strong> (or <strong>Demo Audit</strong> locally) to execute a 22-rule Admin + Data API diagnostic across 5 categories:
              </p>

              <div className="docs-table-wrap" tabIndex={0} role="region" aria-label="Documentation Reference Table">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Audit Category</th>
                      <th>What Is Inspected</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Cross-Domain &amp; Referrals</strong></td>
                      <td>Self-referral leaks, payment gateway (Stripe/PayPal) and hotel booking engine attribution hijacks (Synxis, Mews, TravelClick, etc.), staging/localhost hostname pollution, and multi-domain setups.</td>
                    </tr>
                    <tr>
                      <td><strong>9 Integrations &amp; Links</strong></td>
                      <td>Verifies live status for <strong>Google Search Console</strong>, <strong>Google Ads</strong> (including Paid Search link urgency), <strong>BigQuery Export</strong>, <strong>Google Signals</strong>, <strong>Enhanced Measurement</strong>, <strong>DV360</strong>, <strong>SA360</strong>, <strong>AdSense</strong>, and <strong>Measurement Protocol Secrets</strong>.</td>
                    </tr>
                    <tr>
                      <td><strong>Property Configuration</strong></td>
                      <td>14-month vs 2-month event retention, Attribution model &amp; lookback windows, Property timezone/currency completeness, Web Data Streams, and custom dimension/metric quota usage.</td>
                    </tr>
                    <tr>
                      <td><strong>Data Quality &amp; Privacy</strong></td>
                      <td>Scans top 100 GA4 page URLs for PII exposure (email addresses, phone query params, <code>fbclid</code>/<code>gclid</code> noise), unassigned traffic %, high bounce/low engagement anomalies, and active data collection.</td>
                    </tr>
                    <tr>
                      <td><strong>Conversions &amp; Events</strong></td>
                      <td>Checks Key Events (<code>conversionEvents</code> fallback), zero-value/broken Key Events, custom non-standard event explosion, and ecommerce purchase vs transaction tracking integrity.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 7. Project Analytics & Settings */}
            <section id="project-analytics" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><BarChart3 size={20} /></div>
                <h2>7. Project Analytics &amp; Workspace Settings</h2>
              </div>
              <ul>
                <li><strong>Project Analytics (<code>/projects/:projectId/analytics</code>):</strong> Displays trailing 30-day GA4 sessions, active users, key events/conversions, revenue charts, plus strictly project-scoped GTM and GA4 audit tables.</li>
                <li><strong>Project Settings (<code>/projects/:projectId/settings</code>):</strong> Rename the project, update its website URL or industry perspective, re-bind GA4 Property / GTM Container / Workspace / Measurement ID, or permanently delete the project without altering Google accounts.</li>
              </ul>
            </section>

            {/* 8. Plans, Quotas & Billing */}
            <section id="plans-quotas" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><CreditCard size={20} /></div>
                <h2>8. Plans, Quotas &amp; Billing</h2>
              </div>
              <div className="docs-table-wrap" tabIndex={0} role="region" aria-label="Documentation Reference Table">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Plan Tier</th>
                      <th>Monthly Price</th>
                      <th>Projects &amp; GTM Workspaces</th>
                      <th>GA4 Observer &amp; Audits</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Free</strong></td>
                      <td>$0/mo</td>
                      <td>1 GTM Workspace (requires plan upgrade for Organization Projects)</td>
                      <td>5 GTM Workspace Audits; Demo / basic inspection</td>
                    </tr>
                    <tr>
                      <td><strong>Pro</strong></td>
                      <td>$149/mo</td>
                      <td>Up to 10 isolated projects &amp; unlimited GTM recipe deployments</td>
                      <td>Up to 10 GA4 Observer monitors, unlimited GTM &amp; 22-point GA4 audits + PDF</td>
                    </tr>
                    <tr>
                      <td><strong>Custom</strong></td>
                      <td>$149+/mo (10% off at 15+)</td>
                      <td>Scales 10–100+ projects &amp; GTM workspaces</td>
                      <td>10–100+ monitors, custom white-label sender domain, priority support SLAs</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 9. Troubleshooting */}
            <section id="troubleshooting" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Wrench size={20} /></div>
                <h2>9. Troubleshooting &amp; Quick Tips</h2>
              </div>
              <ul>
                <li>
                  <strong>&ldquo;Already Exists&rdquo; in GTM Deployment Logs:</strong> GTMObserver intentionally skips creating any Tag, Trigger, or Variable whose exact name already exists in your container so live client rules are never overwritten.
                </li>
                <li>
                  <strong>&ldquo;Google account not connected or missing refresh token&rdquo;:</strong> Re-authorize Google via <strong>Project Settings</strong> or Onboarding so Google returns an offline <code>refresh_token</code> (make sure to check all requested Tag Manager and Analytics permission boxes).
                </li>
                <li>
                  <strong>Redirected to Billing after Sign-In:</strong> Accounts on the <code>free</code> tier are gated to <code>/billing</code> until a Pro or Custom package is purchased, after which you proceed straight to guided Project Onboarding.
                </li>
                <li>
                  <strong>Need Engineering Assistance?</strong> Reach us via <Link to="/community">Community</Link> or email <a href="mailto:info@gtmobserver.com">info@gtmobserver.com</a>.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
