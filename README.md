# GTMObserver

**GTMObserver** (`https://gtmobserver.com` | `https://app.gtmobserver.com`) is an edge-native Google Tag Manager automation, GA4 property auditing, and 24/7 GA4 anomaly detection SaaS built on **React + TypeScript + Vite**, **Hono**, **Cloudflare Workers**, **Cloudflare D1**, and **Clerk**.

## Core Features

- **Personal Workspaces & Multi-Tenant Organizations**
  - Choose between a **Personal** solo workspace or an **Organization** portfolio during sign-up (`/sign-up` & `/choose-organization`).
  - Manage 50+ client websites across scoped Organization Dashboards (`/organizations/:orgId`) and an Organization overview (`/organization`) with Card and Table views, search, health filters, industry chips, bulk organization assignment, bulk sharing, and bulk Trash.
  - Native Clerk Organizations integration: switch Personal Account and Organizations from the sidebar, create new organizations, invite team members, assign roles, or remove an organization while preserving websites safely in your Personal Workspace.
- **Universal Project Sharing & Team Access Control (`/access`)**
  - Manage Organization-wide roles alongside universal email-based per-project grants (`viewer`, `editor`, `admin`), with automatic pending grant claiming when collaborators sign up.
- **Polar.sh Billing & 4-Step Project Onboarding (`/billing`, `/onboarding`)**
  - Live Polar.sh product/checkout integration, Workspace Capacity meter, Customer Portal access, and webhook subscription syncing.
  - Guided 4-step Project Onboarding connecting Google Analytics 4 (GA4) OAuth, Google Tag Manager (GTM) account/container/workspace bindings, and starter GA4 Observer rules.
- **GTM Automation Recipes & Health Audits**
  - Non-destructive 1-click deployment via Google Tag Manager API v2 across basic outbound links, engagement & video events, WordPress/CRM/hospitality forms, WooCommerce GA4 E-Commerce, and 6 hotel booking engines (**StayNTouch**, **Synxis/SBE**, **Windsurfer**, **Mews**, **iHotelier**, **Safara**).
  - GTM Workspace Health Audit (duplicate tags, shared triggers, orphaned triggers/variables) with server-rendered A4 PDF reports (`/api/gtm/audits/:auditId/pdf`).
- **Autonomous GA4 Observer & 22-Point GA4 Property Audit**
  - Cloudflare Scheduled Cron (`*/15 * * * *`) evaluating active monitors across 14 GA4 metrics, 6 operators, 20 starter templates, 11 comparison windows, traffic/device segmentation, and local IANA timezones with daily deduplication.
  - 22-Point GA4 Property Audit inspecting referrals/cross-domain setup, 9 integrations, data retention & attribution, URL PII/privacy leaks, and Key Events with executive A4 PDF exports (`/api/ga4/audits/:auditId/pdf`).
  - Branded HTML + PDF alerts dispatched via Resend (`alerts@gtmobserver.com`) with separate Automated Incident and Manual Report histories.
- **Safe Project Trash & Automatic Monitor Closure**
  - Moving a project to Trash immediately closes its attached GA4 Observer monitors so cron alerts stop firing immediately. Projects can be restored from Trash or permanently deleted with cascading cleanup.

## Security Architecture

- **Authentication**: Clerk RS256 JWKS verification on all `/api/*` endpoints (fail-closed HTTP `401` on missing/invalid tokens).
- **OAuth & Webhook Integrity**: HMAC-SHA256 signed Google OAuth2 `state` tokens with timing-safe verification; Standard Webhooks signature verification on Polar.sh billing webhooks.
- **HTTP Hardening**: Strict CORS origin allowlist (`gtmobserver.com` and `app.gtmobserver.com`), `Cache-Control: no-store, private` on API responses, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, and `Permissions-Policy`.

## Architecture & Directory Structure

- `src/pages/` — Application pages (`Home`, `OrganizationDashboard`, `OrganizationAccessPage`, `AccessDashboard`, `Billing`, `ProjectOnboarding`, `ProjectOverview`, `Dashboard`, `Observer`, `Analytics`, `ProjectSettings`, `Settings`, `Documentation`, `ApiReference`, `Support`, `SignInPage`, `SignUpPage`, `ChooseOrganizationPage`).
- `src/components/` — Layout (`Navbar`, `Sidebar`), marketing sections, UI components (`ClerkOrgBoundary`, `AuditModal`, `Ga4AuditModal`), and GTM modules.
- `src/context/WorkspaceContext.tsx` — Centralized workspace state, Clerk Organization synchronization, organization removal, and `SubscriptionGate`.
- `src/worker.ts` — Hono Worker entry handling `/api/*` routing, CORS, global security headers, SEO `HTMLRewriter`, and Cloudflare Cron (`*/15 * * * *`) triggers.
- `functions/api/` — Serverless edge API handlers (`organizations.ts`, `projects.ts`, `access.ts`, `user/me.ts`, `polar/*`, `gtm/*`, `ga4/*`, `auth/google/*`).
- `wrangler.jsonc` — Cloudflare Worker configuration (`DB` D1 binding, `BROWSER` binding, `ASSETS` static directory, custom domains, and cron trigger).

## Environment & Worker Bindings

- **Frontend (`Vite`)**:
  - `VITE_CLERK_PUBLISHABLE_KEY`
- **Cloudflare Worker Bindings (`wrangler.jsonc`)**:
  - `DB` (Cloudflare D1 database `gtm_automation_d1`)
  - `BROWSER` (Cloudflare Browser Rendering binding for PDF generation)
  - `ASSETS` (Built `dist/` static assets)
- **Worker Secrets / Environment Variables**:
  - `CLERK_ISSUER`, `CLERK_JWKS_URL`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `POLAR_ACCESS_TOKEN`, `POLAR_ORGANIZATION_ID`, `POLAR_PRODUCT_PRO_ID`, `POLAR_PRODUCT_CUSTOM_ID`, `POLAR_WEBHOOK_SECRET`
  - `RESEND_API_KEY`, `CRON_SECRET`

## Scripts

```bash
# Local Vite dev server
npm run dev

# Static typechecks & production build
npx tsc --noEmit
npx tsc -p tsconfig.worker.json --noEmit
npm run build

# Dry-run Worker bundle verification
npx wrangler deploy --dry-run

# Build and deploy to Cloudflare Workers
npm run deploy
```
