// @ts-nocheck
import { motion } from 'framer-motion';
import { PageTransition } from '../components/ui/PageTransition';
import { BackgroundMesh } from '../components/ui/BackgroundMesh';
import './Legal.css';

export const ApiReference = () => {
  return (
    <PageTransition locationKey="api">
      <BackgroundMesh />
      <div className="legal-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="legal-content"
        >
          <h1>API Reference</h1>
          <p className="last-updated">Last Updated: November 26, 2026</p>

          <section>
            <h2>1. Authentication, Security &amp; Headers</h2>
            <p>
              All GTMObserver application endpoints under <code>/api/*</code> run on Cloudflare Workers and require a valid Clerk RS256 session JWT supplied via the <code>Authorization: Bearer &lt;token&gt;</code> header (verified against live JWKS keys). Unauthenticated requests fail closed with HTTP <code>401</code>.
            </p>
            <ul>
              <li><strong>Strict CORS Allowlist:</strong> Only <code>https://gtmobserver.com</code> and <code>https://app.gtmobserver.com</code> (plus <code>localhost</code> in development) are permitted on cross-origin API calls.</li>
              <li><strong>Security Response Headers:</strong> All responses enforce <code>Strict-Transport-Security</code>, <code>X-Content-Type-Options: nosniff</code>, <code>X-Frame-Options: DENY</code>, <code>Referrer-Policy</code>, and <code>Cache-Control: no-store, private</code> on API payloads.</li>
              <li><strong>Role-Based Access Control (RBAC):</strong> Organization and project endpoints resolve ownership, organization membership, active Clerk Organization claims, and universal project grants (<code>viewer</code>, <code>editor</code>, <code>admin</code>, <code>owner</code>).</li>
            </ul>
          </section>

          <section>
            <h2>2. Organizations, Teams &amp; Universal Access</h2>
            <ul>
              <li><code>GET /api/organizations</code> — Syncs the active Clerk Organization into D1 (when present) and lists all accessible organizations with member and project counts.</li>
              <li><code>POST /api/organizations</code> — Provisions organization metadata linked to a valid Clerk <code>clerkOrgId</code>.</li>
              <li><code>PATCH /api/organizations</code> — Bulk-assigns projects to an organization, adds/updates/removes organization members, or updates organization metadata.</li>
              <li><code>DELETE /api/organizations?id=&#123;orgId&#125;</code> — Removes an organization and safely unassigns its websites back to Personal Workspace.</li>
              <li><code>GET / POST / PATCH / DELETE /api/access</code> — Lists, creates, updates roles on, or revokes universal email-based per-project sharing grants across one or multiple selected projects.</li>
            </ul>
          </section>

          <section>
            <h2>3. Projects &amp; Trash Lifecycle</h2>
            <ul>
              <li><code>GET /api/projects</code> — Returns all active and trashed projects visible to the caller, filtered optionally by <code>?organizationId=</code> or fetched individually via <code>?id=&#123;projectId&#125;</code>.</li>
              <li><code>POST /api/projects</code> — Creates an isolated project workspace bound to an organization (or Personal Workspace on active paid plans) with optional GA4/GTM IDs.</li>
              <li><code>PATCH / PUT /api/projects</code> — Supports project updates plus <code>action: &quot;trash&quot;</code> (immediately closes attached GA4 monitors), <code>action: &quot;restore&quot;</code>, <code>action: &quot;permanent_delete&quot;</code> (cascading cleanup), and <code>action: &quot;empty_trash&quot;</code>.</li>
            </ul>
          </section>

          <section>
            <h2>4. GTM Automation, Audits &amp; A4 PDF Export</h2>
            <ul>
              <li><code>GET /api/gtm/accounts</code>, <code>/api/gtm/containers</code>, <code>/api/gtm/workspaces</code> — Lists accessible Google Tag Manager hierarchy resources via Google OAuth2.</li>
              <li><code>POST /api/gtm/verify-config</code> — Verifies or deploys the base GA4 configuration tag in the target GTM workspace.</li>
              <li><code>POST /api/gtm/generate</code> — Deploys selected GTM recipe bundles (outbound links, engagement, WordPress/CRM/hospitality forms, WooCommerce, and 6 hotel booking engines).</li>
              <li><code>POST /api/gtm/audit</code> &amp; <code>GET /api/gtm/audit-logs</code> — Executes GTM workspace health audits (duplicate tags, shared triggers, orphaned triggers/variables) and retrieves project-scoped history.</li>
              <li><code>GET /api/gtm/audits/:auditId/pdf</code> — Streams a formatted A4 PDF GTM Workspace Audit report.</li>
            </ul>
            <p>Upstream <a href="https://developers.google.com/tag-platform/tag-manager/api/v2" target="_blank" rel="noopener noreferrer">Google Tag Manager API v2</a> mutations are rate-paced (2000ms between write calls) to prevent Google API <code>429</code> quota exhaustion on large container recipes.</p>
          </section>

          <section>
            <h2>5. GA4 Observer, 22-Point Property Audits &amp; Cron</h2>
            <ul>
              <li><code>GET /api/ga4/properties</code> &amp; <code>GET /api/ga4/report</code> — Fetches Google Analytics 4 Admin API properties and 30-day Data API <code>v1beta:runReport</code> metrics.</li>
              <li><code>GET / POST / PUT / DELETE /api/ga4/monitors</code> — Manages GA4 Observer rules (14 metrics, 6 operators, compound <code>ANY</code>/<code>ALL</code> conditions, traffic/device segmentation, and 11 comparison windows).</li>
              <li><code>POST /api/ga4/test</code> — Runs live rule evaluation and dispatches an immediate HTML + PDF report via Resend.</li>
              <li><code>POST / GET /api/ga4/audit</code> &amp; <code>GET /api/ga4/audits/:auditId/pdf</code> — Executes the 22-point GA4 Admin + Data API audit and exports branded executive A4 PDF reports.</li>
              <li><code>*/15 * * * *</code> Cloudflare Scheduled Trigger — Evaluates active, non-trashed monitors every 15 minutes against user/monitor IANA timezones with daily deduplication.</li>
            </ul>
          </section>

          <section>
            <h2>6. User Profile, Google OAuth2 &amp; Polar.sh Billing</h2>
            <ul>
              <li><code>GET / PATCH /api/user/me</code> — Returns subscription tier, workspace capacity limit, shared access status, and default Observer schedule/timezone settings.</li>
              <li><code>GET /api/auth/status</code>, <code>GET /api/auth/google/login</code>, <code>GET /api/auth/google/callback</code> — HMAC-signed Google OAuth2 flow for Analytics &amp; Tag Manager scopes.</li>
              <li><code>GET /api/polar/products</code>, <code>POST /api/polar/checkout</code>, <code>POST /api/polar/portal</code>, <code>POST /api/polar/sync</code>, <code>POST /api/polar/webhook</code> — Live Polar.sh catalog, subscription checkout, Customer Portal links, and Standard Webhooks verified sync.</li>
            </ul>
          </section>
        </motion.div>
      </div>
    </PageTransition>
  );
};
