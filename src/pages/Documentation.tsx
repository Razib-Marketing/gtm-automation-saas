// @ts-nocheck
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  Users,
  Compass,
  Trash2,
  Code2,
  ShieldCheck,
  Activity,
  FileSearch,
  Lock,
  Wrench,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Documentation.css';

export const Documentation: React.FC = () => {
  const [tocOpen, setTocOpen] = useState(false);

  const tocItems = [
    { href: '#architecture', label: '1. Personal, Organization & Project Architecture', icon: Layers },
    { href: '#access-teams', label: '2. Team Access, Roles & Universal Sharing', icon: Users },
    { href: '#onboarding', label: '3. Billing & 4-Step Project Onboarding', icon: Compass },
    { href: '#trash-lifecycle', label: '4. Project Lifecycle, Trash & Monitors', icon: Trash2 },
    { href: '#gtm-recipes', label: '5. GTM Automation Recipes', icon: Code2 },
    { href: '#gtm-audit', label: '6. GTM Workspace Audit & A4 PDF', icon: ShieldCheck },
    { href: '#ga4-observer', label: '7. GA4 Observer & 15-Min Schedules', icon: Activity },
    { href: '#ga4-audit', label: '8. 22-Point GA4 Property Audit & PDF', icon: FileSearch },
    { href: '#security-settings', label: '9. Analytics, Settings & Security', icon: Lock },
    { href: '#troubleshooting', label: '10. Troubleshooting & Support', icon: Wrench }
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
            Complete product and engineering reference covering Personal &amp; Organization workspaces, role-based team sharing, Polar.sh billing, 4-step project onboarding, project Trash lifecycle, 1-click GTM recipe deployment, GTM &amp; 22-point GA4 audits with A4 PDF exports, autonomous 15-minute GA4 Observer alerts, and edge security controls.
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
              <span>On This Page (10 Sections)</span>
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
              </div>
            </div>
          </aside>

          {/* Main Documentation Sections */}
          <div className="docs-main">
            {/* 1. Architecture */}
            <section id="architecture" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Layers size={20} /></div>
                <h2>1. Personal, Organization &amp; Project-Level Architecture</h2>
              </div>
              <p>
                GTMObserver supports both solo <strong>Personal Workspaces</strong> and multi-client <strong>Organizations</strong>, keeping every website isolated inside its own Project Workspace so teams never deploy tags or inspect metrics across the wrong client property.
              </p>

              <div className="docs-flow-strip" aria-label="End-to-End Platform User Flow">
                <span className="docs-flow-node">Personal or Org Sign-Up</span>
                <span className="docs-flow-arrow">&rarr;</span>
                <span className="docs-flow-node">Billing &amp; Plan Sync</span>
                <span className="docs-flow-arrow">&rarr;</span>
                <span className="docs-flow-node">Project Onboarding</span>
                <span className="docs-flow-arrow">&rarr;</span>
                <span className="docs-flow-node">Org / Scoped Dashboard</span>
                <span className="docs-flow-arrow">&rarr;</span>
                <span className="docs-flow-node">Project Workspace</span>
              </div>

              <div className="docs-grid-2">
                <div className="docs-mini-box">
                  <h4>Personal &amp; Organization Views (/organization, /organizations/:orgId)</h4>
                  <p>
                    During sign-up (<code>/sign-up</code>), choose <strong>Personal</strong> for a solo workspace or <strong>Organization</strong> to set up a shared agency portfolio (<code>/choose-organization</code>). Use the sidebar organization switcher to jump between Personal Workspace and Organizations, create new organizations, or manage 50+ websites in Card or Table view with search, health filters, industry chips, and bulk actions. Removing an organization safely preserves all its websites inside your Personal Workspace.
                  </p>
                </div>
                <div className="docs-mini-box">
                  <h4>Project Workspace (/projects/:projectId/*)</h4>
                  <p>
                    Selecting a project switches the sidebar into dedicated Project Mode (Overview, GTM Automation &amp; Audit, GA4 Observer &amp; Audit, Project Analytics, and Project Settings). All container bindings, monitor schedules, alerts, and historical PDF audits are scoped strictly to that project.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Team Access, Roles & Universal Sharing */}
            <section id="access-teams" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Users size={20} /></div>
                <h2>2. Team Access, Roles &amp; Universal Project Sharing</h2>
              </div>
              <p>
                Agencies and multi-brand operators can manage collaborator permissions at two levels from <strong>Access &amp; Teams</strong> (<code>/access</code>), <strong>Org Settings &rarr; Organization</strong>, or directly from each project card:
              </p>
              <ul>
                <li>
                  <strong>Organization &amp; Team Management:</strong> Invite teammates into your active Organization, assign <strong>Admin</strong> or <strong>Member</strong> roles, switch organizations in the sidebar, and automatically grant team access across projects synced inside that organization.
                </li>
                <li>
                  <strong>Universal Per-Project Sharing:</strong> Share 1 or 50+ selected websites directly with any collaborator email (contractors, client stakeholders, or analysts) using <strong>Viewer</strong>, <strong>Editor</strong>, or <strong>Admin</strong> roles—even if they have a Personal account outside your organization.
                </li>
                <li>
                  <strong>Automatic Pending Grant Claiming:</strong> Invitations sent to teammates who have not signed up yet are held as pending grants and automatically activated the moment they authenticate with their verified email address.
                </li>
              </ul>
            </section>

            {/* 3. Billing & Onboarding */}
            <section id="onboarding" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Compass size={20} /></div>
                <h2>3. Billing, Polar.sh Subscription &amp; 4-Step Onboarding</h2>
              </div>
              <h3>Polar.sh Billing Verification (/billing)</h3>
              <p>
                Authenticated users with an active paid package (<code>pro</code> or <code>custom</code>) or collaborator access granted via a team/project invitation enter the workspace immediately. Unsubscribed accounts are guided to <strong>Billing &amp; Plan</strong> (<code>/billing</code>), where Polar.sh checkout provisions workspace capacity and webhooks sync plan tier changes automatically. Active subscribers can inspect their live <strong>Workspace Capacity</strong> bar and open the <strong>Polar Customer Portal</strong> in one click for invoices, payment methods, and subscription updates.
              </p>

              <h3>4-Step Guided Project Setup Wizard (/onboarding)</h3>
              <ol>
                <li>
                  <strong>Project Details &amp; Organization Assignment:</strong> Enter the project name, website URL, target industry perspective (<code>General</code>, <code>Hospitality &amp; Hotels</code>, <code>E-Commerce</code>, <code>Lead Generation</code>, <code>SaaS</code>, or <code>Content &amp; Media</code>), and assign it to an Organization or Personal Workspace.
                </li>
                <li>
                  <strong>Connect Google Analytics (GA4):</strong> Authorize Google OAuth2 (using <code>analytics.readonly</code>, <code>tagmanager.readonly</code>, and <code>tagmanager.edit.containers</code> scopes) and bind the target GA4 Property.
                </li>
                <li>
                  <strong>Connect Google Tag Manager (GTM):</strong> Bind the GTM Account, Container, Workspace, and optional GA4 Measurement ID (<code>G-XXXXXXXXXX</code>).
                </li>
                <li>
                  <strong>Configure Triggers &amp; Observer Rules:</strong> Select starter GA4 Observer templates matched to your website type or define custom rules, choose evaluation schedule and timezone, add alert recipient emails, and launch the project workspace.
                </li>
              </ol>
            </section>

            {/* 4. Project Lifecycle, Trash & Monitor Closure */}
            <section id="trash-lifecycle" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Trash2 size={20} /></div>
                <h2>4. Project Lifecycle, Safe Trash &amp; Automatic Monitor Closure</h2>
              </div>
              <p>
                Projects can be edited or retired safely without leaving orphaned background cron jobs or stale anomaly alert emails running:
              </p>
              <ul>
                <li>
                  <strong>Quick Edit &amp; Re-binding:</strong> Update project name, domain, industry category, Organization assignment, or GA4/GTM container bindings anytime from the Organization Dashboard quick-edit action or <strong>Project Settings</strong> (<code>/projects/:projectId/settings</code>).
                </li>
                <li>
                  <strong>Move to Trash (Closes All Monitors Automatically):</strong> Moving a project to Trash immediately marks all project-scoped GA4 Observer monitors as inactive/closed so cron sweeps stop evaluating and emailing for that site right away.
                </li>
                <li>
                  <strong>Restore, Delete Forever &amp; Empty Trash:</strong> Open the <strong>Trash</strong> scope to restore a project back to active status, permanently delete individual projects (cascading cleanup of monitors, alerts, audit logs, and sharing grants), or run <strong>Empty Trash</strong>. Deleting a project in GTMObserver never modifies your live Google Analytics or Google Tag Manager accounts.
                </li>
              </ul>
            </section>

            {/* 5. GTM Recipes */}
            <section id="gtm-recipes" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Code2 size={20} /></div>
                <h2>5. GTM Automation &amp; Tracking Recipe Library</h2>
              </div>
              <p>
                Inside any Project Workspace under <strong>GTM Automation &amp; Audit</strong>, your project&apos;s linked GTM Account, Container, and Workspace are pre-bound. Before injecting tags, use <strong>Verify GA4 Config</strong> to ensure a base Google Tag (<code>G-XXXXXXXXXX</code>) exists, then select recipes across these supported categories:
              </p>

              <div className="docs-table-wrap" tabIndex={0} role="region" aria-label="Supported GTM Recipe Modules">
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
                        Elementor Forms, Contact Form 7, Gravity Forms, HubSpot Forms, Salesforce Forms, Revinate Forms, Zmail Direct Newsletter iframes, Generic HTML Forms, and Custom PHP (<code>sendmail.php</code>) forms — configurable for <em>Wedding RFP, Event RFP, Newsletter, Contact, or Generic</em> intents.
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Hotel Booking Engines</strong></td>
                      <td>
                        Full Standard E-Commerce + Booking Entrance link tracking for <strong>StayNTouch</strong>, <strong>Synxis/SBE</strong>, <strong>Windsurfer</strong>, <strong>Mews</strong>, <strong>iHotelier</strong>, and <strong>Safara</strong>.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="docs-callout">
                <strong>Safe Non-Destructive Deployment:</strong> GTMObserver skips tags, triggers, or variables that already exist with identical names in your workspace and optionally injects Meta Pixel or Google Ads conversion tags alongside GA4 events.
              </div>
            </section>

            {/* 6. GTM Workspace Audit */}
            <section id="gtm-audit" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><ShieldCheck size={20} /></div>
                <h2>6. GTM Workspace Health Audit &amp; A4 PDF Reports</h2>
              </div>
              <p>
                Click <strong>Run Audit</strong> inside your project&apos;s GTM Automation view to scan all Tags, Triggers, and Variables in the project&apos;s linked GTM workspace:
              </p>
              <ul>
                <li><strong>Duplicate Tags Detected (Critical, &minus;20 pts):</strong> Flags multiple tags of the same type firing on the same trigger (which double-count conversions).</li>
                <li><strong>Shared Trigger Notice (Moderate, &minus;5 pts):</strong> Highlights triggers shared across multiple distinct tags for verification.</li>
                <li><strong>Orphaned Triggers &amp; Variables (Moderate, &minus;5 pts):</strong> Identifies unattached triggers or unreferenced variables bloating container size.</li>
                <li><strong>Server-Rendered A4 PDF Export:</strong> Download a branded multi-section A4 PDF report via Cloudflare Browser Rendering (<code>/api/gtm/audits/:auditId/pdf</code>), backed by project-scoped audit history in D1.</li>
              </ul>
            </section>

            {/* 7. GA4 Observer */}
            <section id="ga4-observer" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Activity size={20} /></div>
                <h2>7. GA4 Observer — 15-Minute Edge Schedules &amp; Alerts</h2>
              </div>
              <p>
                GA4 Observer continuously evaluates live metrics via the Google Analytics Data API <code>v1beta:runReport</code> from Cloudflare Workers edge cron triggers.
              </p>

              <h3>Custom Evaluation Schedules &amp; Timezones</h3>
              <ul>
                <li><strong>15-Minute Edge Sweep:</strong> Cloudflare Cron triggers every 15 minutes (<code>*/15 * * * *</code>) and evaluates active monitors (excluding paused or trashed projects) once their local target window (<code>schedule_time</code> in <code>schedule_timezone</code> IANA timezone) opens.</li>
                <li><strong>Duplicate Prevention:</strong> Each monitor tracks <code>last_run_local_date</code> so each scheduled day, week, or month dispatches at most one alert evaluation.</li>
                <li><strong>Account Defaults &amp; Monitor Overrides:</strong> Configure a global schedule in <strong>Org Settings</strong> or customize <code>Daily</code>, <code>Weekly (Mon)</code>, or <code>Monthly (1st)</code> timing per monitor.</li>
              </ul>

              <h3>Supported Metrics, Operators, Templates &amp; Windows</h3>
              <div className="docs-grid-2">
                <div className="docs-mini-box">
                  <h4>14 GA4 Metrics &amp; 6 Operators</h4>
                  <p>
                    Monitor <code>sessions</code>, <code>activeUsers</code>, <code>totalUsers</code>, <code>newUsers</code>, <code>engagementRate</code>, <code>bounceRate</code>, <code>averageSessionDuration</code>, <code>keyEvents</code>, <code>transactions</code>, <code>totalRevenue</code>, <code>ecommercePurchases</code>, <code>sessionKeyEventRate</code>, <code>screenPageViews</code>, and <code>eventCount</code> using <strong>Drops %</strong>, <strong>Spikes %</strong>, <strong>Changes &plusmn;%</strong>, <strong>Equals 0 (Outage)</strong>, <strong>Falls Under Value</strong>, or <strong>Exceeds Value</strong>.
                  </p>
                </div>
                <div className="docs-mini-box">
                  <h4>20 Templates &amp; 11 Comparison Windows</h4>
                  <p>
                    Pick from 20 templates across 6 categories (including 6 <strong>Hospitality &amp; Hotels</strong> presets) and compare across <em>Yesterday vs Last Week, Day over Day, Rolling/Calendar WoW, Calendar/Rolling MoM, 28-Day Cycle, YoY 7d, YoY 30d, YoY Calendar Month, and YoY Single Day</em>.
                  </p>
                </div>
              </div>

              <ul>
                <li><strong>Compound &amp; Segmented Filtering:</strong> Combine conditions with <code>ANY (OR)</code> or <code>ALL (AND)</code> logic, filtered by Channel/Source, Medium, and <code>deviceCategory</code> (Desktop, Mobile, Tablet).</li>
                <li><strong>On-Demand Testing &amp; PDF Attachments:</strong> Click <strong>Test &amp; Send Report</strong> to run live rules immediately and dispatch Resend HTML alerts (with attached PDF telemetry snapshots). Incident Alerts and Manual Reports are logged separately.</li>
              </ul>
            </section>

            {/* 8. 22-Point GA4 Property Audit */}
            <section id="ga4-audit" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><FileSearch size={20} /></div>
                <h2>8. 22-Point GA4 Property Audit &amp; Executive PDF</h2>
              </div>
              <p>
                Directly inside every project&apos;s <strong>GA4 Observer &amp; Audit</strong> page, run the 22-rule Admin + Data API diagnostic and export the executive A4 PDF (<code>/api/ga4/audits/:auditId/pdf</code>):
              </p>

              <div className="docs-table-wrap" tabIndex={0} role="region" aria-label="22-Point GA4 Audit Categories">
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
                      <td>Self-referral leaks, payment gateway (Stripe/PayPal) and hotel booking engine attribution hijacks (Synxis, Mews, TravelClick, etc.), staging/localhost hostname pollution, and multi-domain tracking.</td>
                    </tr>
                    <tr>
                      <td><strong>9 Integrations &amp; Links</strong></td>
                      <td>Verifies live status for <strong>Google Search Console</strong>, <strong>Google Ads</strong> (including Paid Search link checks), <strong>BigQuery Export</strong>, <strong>Google Signals</strong>, <strong>Enhanced Measurement</strong>, <strong>DV360</strong>, <strong>SA360</strong>, <strong>AdSense</strong>, and <strong>Measurement Protocol Secrets</strong>.</td>
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
                      <td>Checks Key Events (with <code>conversionEvents</code> fallback), zero-value/broken Key Events, non-standard event bloat, and ecommerce purchase vs transaction tracking integrity.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 9. Project Analytics, Settings & Security */}
            <section id="security-settings" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Lock size={20} /></div>
                <h2>9. Project Analytics, Account Settings &amp; Platform Security</h2>
              </div>
              <div className="docs-grid-2">
                <div className="docs-mini-box">
                  <h4>Analytics &amp; Workspace Settings</h4>
                  <p>
                    <strong>Project Analytics</strong> (<code>/projects/:projectId/analytics</code>) graphs 30-day sessions, users, key events, and revenue alongside scoped audit logs. <strong>Org Settings</strong> (<code>/settings</code>) manages Subscription &amp; Polar Billing Portal, Observer Schedule, Organization &amp; Team profiles, and Clerk Account Details, while the sidebar provides one-click <strong>Log Out</strong>.
                  </p>
                </div>
                <div className="docs-mini-box">
                  <h4>Zero-Trust Edge Security Controls</h4>
                  <p>
                    Every <code>/api/*</code> route enforces RS256 JWKS Clerk JWT verification, D1 project/organization RBAC, strict origin CORS allowlists, and <code>Cache-Control: no-store</code>. Google OAuth flows use HMAC-signed timing-safe state tokens, Polar webhooks verify Standard Webhooks signatures, and all responses include HSTS, <code>X-Frame-Options: DENY</code>, and <code>nosniff</code> headers.
                  </p>
                </div>
              </div>
            </section>

            {/* 10. Troubleshooting */}
            <section id="troubleshooting" className="docs-section-card">
              <div className="docs-section-header">
                <div className="docs-section-icon"><Wrench size={20} /></div>
                <h2>10. Troubleshooting &amp; Quick Tips</h2>
              </div>
              <ul>
                <li>
                  <strong>&ldquo;Already Exists&rdquo; in GTM Deployment Logs:</strong> GTMObserver intentionally skips creating any Tag, Trigger, or Variable whose exact name already exists in your container so existing live tracking rules are never overwritten.
                </li>
                <li>
                  <strong>&ldquo;Google account not connected or missing refresh token&rdquo;:</strong> Re-authorize Google via <strong>Project Settings</strong> or Onboarding so Google returns an offline <code>refresh_token</code> (make sure to approve all requested Tag Manager and Analytics scopes).
                </li>
                <li>
                  <strong>Switching Between Personal &amp; Organization Workspaces:</strong> Use the workspace switcher at the top of the sidebar or create/manage an Organization anytime under <strong>Access &amp; Teams</strong> (<code>/access</code>) or <strong>Org Settings</strong> (<code>/settings</code>).
                </li>
                <li>
                  <strong>Stopping Unwanted GA4 Alerts:</strong> Move any retired project to <strong>Trash</strong> from its card or <strong>Project Settings</strong> to immediately close all attached GA4 monitors, or permanently delete it from Trash.
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
