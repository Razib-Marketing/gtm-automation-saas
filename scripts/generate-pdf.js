import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const logoBase64 = fs.readFileSync(path.join(process.cwd(), 'public/gtmobserver-logo.png')).toString('base64');
const logoDataUri = `data:image/png;base64,${logoBase64}`;

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>GTMObserver — Tracking Ecosystem Expansion & Server-Side Tracking Blueprint</title>
<style>
  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {
      content: counter(page);
    }
  }

  *, *:before, *:after {
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.55;
    font-size: 10.5pt;
    margin: 0;
    padding: 0;
  }

  /* Header Section */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 14px;
    margin-bottom: 24px;
  }

  .logo-img {
    height: 38px;
    width: auto;
  }

  .doc-meta {
    text-align: right;
    font-size: 8.5pt;
    color: #64748b;
  }

  .doc-meta strong {
    color: #0f172a;
  }

  /* Title Banner */
  .title-banner {
    background: linear-gradient(135deg, #0b0f19 0%, #1e1b4b 50%, #0f172a 100%);
    color: #ffffff;
    padding: 24px 28px;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.08);
  }

  .badge-category {
    display: inline-block;
    background: rgba(0, 240, 255, 0.15);
    color: #00F0FF;
    border: 1px solid rgba(0, 240, 255, 0.4);
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    padding: 3px 10px;
    border-radius: 9999px;
    margin-bottom: 8px;
  }

  .title-banner h1 {
    margin: 4px 0 8px 0;
    font-size: 20pt;
    font-weight: 800;
    letter-spacing: -0.5px;
    line-height: 1.25;
    color: #ffffff;
  }

  .title-banner p {
    margin: 0;
    font-size: 10pt;
    color: #cbd5e1;
    max-width: 680px;
  }

  /* Section Headings */
  h2 {
    font-size: 13.5pt;
    color: #0f172a;
    border-left: 4px solid #0284c7;
    padding-left: 10px;
    margin-top: 26px;
    margin-bottom: 12px;
    font-weight: 700;
  }

  h3 {
    font-size: 11pt;
    color: #1e293b;
    margin-top: 16px;
    margin-bottom: 8px;
    font-weight: 600;
  }

  p {
    margin: 0 0 10px 0;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 20px 0;
    font-size: 9pt;
  }

  th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    padding: 9px 12px;
    border-top: 1px solid #0f172a;
    border-bottom: 1px solid #0f172a;
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }

  tr:nth-child(even) td {
    background: #f8fafc;
  }

  .status-badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
  }

  .badge-high { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
  .badge-crit { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .badge-opt  { background: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
  .badge-act  { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }

  /* Callout Boxes */
  .callout-box {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-left: 4px solid #16a34a;
    padding: 12px 16px;
    border-radius: 8px;
    margin: 16px 0;
    font-size: 9.5pt;
  }

  .callout-box.info {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-left: 4px solid #0284c7;
  }

  .callout-box.warning {
    background: #fffbeb;
    border: 1px solid #fef3c7;
    border-left: 4px solid #d97706;
  }

  .callout-title {
    font-weight: 700;
    margin-bottom: 4px;
    color: #0f172a;
  }

  /* Code snippet style */
  .code-block {
    background: #0f172a;
    color: #e2e8f0;
    padding: 12px 16px;
    border-radius: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 8.5pt;
    margin: 12px 0 16px 0;
    line-height: 1.45;
    overflow-x: hidden;
  }

  .code-keyword { color: #38bdf8; font-weight: 600; }
  .code-string { color: #34d399; }
  .code-comment { color: #94a3b8; font-style: italic; }

  /* Diagram Box */
  .diagram-container {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    text-align: center;
  }

  .diagram-flow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 8.5pt;
    font-weight: 600;
  }

  .diagram-step {
    flex: 1;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.03);
  }

  .diagram-step.highlight {
    background: #f0f9ff;
    border: 1.5px solid #0284c7;
    color: #0369a1;
  }

  .diagram-arrow {
    font-size: 14pt;
    color: #94a3b8;
    flex-shrink: 0;
  }

  /* Lists */
  ul, ol {
    margin: 6px 0 12px 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  .page-break {
    page-break-before: always;
  }

  .avoid-break {
    page-break-inside: avoid;
  }

  .footer-note {
    font-size: 8pt;
    color: #94a3b8;
    text-align: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
    margin-top: 30px;
  }
</style>
</head>
<body>

  <!-- DOCUMENT HEADER -->
  <div class="doc-header">
    <img src="${logoDataUri}" class="logo-img" alt="GTMObserver Logo">
    <div class="doc-meta">
      <strong>TECHNICAL ARCHITECTURE BLUEPRINT</strong><br>
      Ecosystem Expansion & Server-Side Tracking Roadmap<br>
      Version: 1.0.0 &bull; Date: October 2026
    </div>
  </div>

  <!-- TITLE BANNER -->
  <div class="title-banner">
    <div class="badge-category">System Architecture & Product Strategy</div>
    <h1>Comprehensive Tracking Ecosystem & Server-Side Architecture Blueprint</h1>
    <p>A strategic guide on missing tracking protocols, advertising pixel conversion engines, Google Consent Mode v2, and deploying zero-cost, high-performance Server-Side Tracking via Cloudflare Workers and Server GTM.</p>
  </div>

  <!-- SECTION 1 -->
  <div class="avoid-break">
    <h2>1. Executive Summary & Current Platform Audit</h2>
    <p>GTMObserver currently provides best-in-class automated deployments for <strong>Basic & Outbound Link Clicks</strong> (Phone, Email, Social, OTAs, Maps), <strong>Lead Generation Forms</strong> (Elementor, CF7, Gravity, HubSpot, Salesforce, Revinate, PHP), and <strong>Hospitality Booking Engines</strong> (SynXis, iHotelier, StayNTouch, Mews, Windsurfer, Safara), coupled with <strong>24/7 GA4 Anomaly Observer intelligence</strong>.</p>
    
    <p>However, modern data privacy regulations (GDPR, DMA), browser restrictions (Apple Safari ITP 24-hour cookie limits, iOS 14.5+ ATT), and ad-blocker adoption (estimated at 35% of traffic) have fundamentally changed web tracking. To capture maximum agency and enterprise market share, GTMObserver must expand in two pivotal directions:</p>
    
    <ol>
      <li><strong>Ad Network Pixel & E-Commerce Coverage:</strong> Unlocking Meta Pixel/CAPI, Google Ads Enhanced Conversions, TikTok Pixel, and Shopify Web Pixels.</li>
      <li><strong>Server-Side Tracking (sGTM):</strong> Transitioning client data collection from fragile browser-only JavaScript to a resilient first-party edge-native server architecture.</li>
    </ol>
  </div>

  <!-- SECTION 2 -->
  <div class="avoid-break">
    <h2>2. Gap Analysis: Missing High-Priority Tracking Systems</h2>
    <p>The following table outlines high-demand tracking categories currently missing from GTMObserver, ranked by immediate market adoption and revenue potential:</p>

    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Tracking Protocol / Platform</th>
          <th>Priority</th>
          <th>Core Events & Requirements</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Advertising Pixels</strong></td>
          <td>Meta (Facebook) Pixel & CAPI</td>
          <td><span class="status-badge badge-high">High Demand</span></td>
          <td>PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Lead. Advanced Matching with hashed email/phone. Event deduplication via <code>event_id</code>.</td>
        </tr>
        <tr>
          <td><strong>Advertising Pixels</strong></td>
          <td>Google Ads Enhanced Conversions</td>
          <td><span class="status-badge badge-high">High Demand</span></td>
          <td>Conversion Linker tag (essential for Safari/iOS), Purchase & Lead conversion tags with user-provided data hashing.</td>
        </tr>
        <tr>
          <td><strong>Advertising Pixels</strong></td>
          <td>TikTok Pixel & Events API</td>
          <td><span class="status-badge badge-opt">High Growth</span></td>
          <td>CompleteRegistration, ViewContent, AddToCart, PlaceAnOrder. Critical for e-commerce brands targeting mobile & Gen Z demographics.</td>
        </tr>
        <tr>
          <td><strong>Advertising Pixels</strong></td>
          <td>LinkedIn Insight Tag & Microsoft UET</td>
          <td><span class="status-badge badge-opt">B2B SaaS</span></td>
          <td>LinkedIn Insight Tag (v2.0) and Microsoft Advertising UET for B2B lead generation, ROI tracking, and corporate accounts.</td>
        </tr>
        <tr>
          <td><strong>Privacy & Legal</strong></td>
          <td>Google Consent Mode v2</td>
          <td><span class="status-badge badge-crit">Mandatory</span></td>
          <td>Required in EU/EEA since March 2024. Default state (denied) for <code>ad_storage</code>, <code>analytics_storage</code>, <code>ad_user_data</code>, <code>ad_personalization</code> + CMP integrations (Cookiebot, OneTrust).</td>
        </tr>
        <tr>
          <td><strong>E-Commerce</strong></td>
          <td>Shopify Web Pixels Suite</td>
          <td><span class="status-badge badge-high">High Demand</span></td>
          <td>Shopify Customer Events sandbox integration. Standard e-commerce lifecycle: view_item, add_to_cart, begin_checkout, add_payment_info, purchase.</td>
        </tr>
        <tr>
          <td><strong>Meeting Schedulers</strong></td>
          <td>Calendly & Chili Piper</td>
          <td><span class="status-badge badge-opt">High Value</span></td>
          <td>iFrame postMessage listeners for <code>calendly.event_scheduled</code>, date/time selected, and booked demo forms.</td>
        </tr>
        <tr>
          <td><strong>Site Performance</strong></td>
          <td>Core Web Vitals to GA4</td>
          <td><span class="status-badge badge-act">Performance</span></td>
          <td>Real-user performance metrics (LCP, INP, CLS, TTFB, FCP) sent directly into GA4 custom metrics for continuous site health monitoring.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="callout-box warning avoid-break">
    <div class="callout-title">Regulatory Requirement: Google Consent Mode v2</div>
    Google has mandated Consent Mode v2 for all Google Ads remarketing and conversion modeling in Europe. Without this tag deployed in GTM, clients running Google Ads in the EEA automatically suffer lost audience lists and degraded campaign attribution. Introducing a 1-click Consent Mode v2 template is an urgent commercial priority.
  </div>

  <!-- PAGE BREAK -->
  <div class="page-break"></div>

  <!-- SECTION 3 -->
  <h2>3. Server-Side Tracking: The Definitive Architectural Guide</h2>
  
  <p>Server-side tracking eliminates third-party cookies by establishing a first-party collection proxy on the client's own domain (e.g. <code>metrics.clientdomain.com</code>). The browser sends a single compressed payload to this endpoint, which then relays the data to destination APIs server-to-server.</p>

  <div class="diagram-container avoid-break">
    <div style="font-weight: 700; margin-bottom: 12px; color: #0f172a; font-size: 9.5pt;">Data Flow: Edge-Native Server-Side Tracking</div>
    <div class="diagram-flow">
      <div class="diagram-step">
        <strong>Visitor Browser</strong><br>
        <span style="font-size: 7.5pt; color: #64748b;">Single first-party request (no adblock)</span>
      </div>
      <div class="diagram-arrow">&rarr;</div>
      <div class="diagram-step highlight">
        <strong>metrics.client.com</strong><br>
        <span style="font-size: 7.5pt; color: #0369a1;">Cloudflare Edge Proxy (Cookies Extended)</span>
      </div>
      <div class="diagram-arrow">&rarr;</div>
      <div class="diagram-step highlight">
        <strong>GTMObserver Worker</strong><br>
        <span style="font-size: 7.5pt; color: #0369a1;">PII Hashing & Event Deduplication</span>
      </div>
      <div class="diagram-arrow">&rarr;</div>
      <div class="diagram-step">
        <strong>Destination APIs</strong><br>
        <span style="font-size: 7.5pt; color: #64748b;">Meta CAPI &bull; GA4 &bull; Google Ads</span>
      </div>
    </div>
  </div>

  <div class="avoid-break">
    <h3>Why Server-Side Tracking is a Competitive Game-Changer</h3>
    <ul>
      <li><strong>Bypasses Ad-Blockers & Safari ITP:</strong> First-party DNS endpoints bypass browser blocklists and extend cookie lifetimes from Safari's 24-hour limit up to 1-2 years using HTTPOnly cookies.</li>
      <li><strong>9.0+ Event Match Quality (EMQ):</strong> Direct server-to-server dispatching includes <code>client_ip_address</code>, <code>client_user_agent</code>, and hashed customer credentials, dramatically improving Meta conversion attribution.</li>
      <li><strong>50%+ Faster Page Load:</strong> Offloads heavy third-party JavaScript tracking libraries from the client device to the edge server.</li>
    </ul>
  </div>

  <div class="avoid-break">
    <h3>Which Server Infrastructure Should You Use?</h3>
    <p>Two distinct architectures can be offered to GTMObserver users:</p>

    <table>
      <thead>
        <tr>
          <th>Attribute</th>
          <th>Path A: Edge-Native CAPI Gateway (Cloudflare Workers)</th>
          <th>Path B: Full Server-Side GTM (Google Cloud Run / Stape)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Architecture</strong></td>
          <td>Serverless TypeScript endpoint on GTMObserver's Cloudflare Worker.</td>
          <td>Official Google sGTM Docker container hosted on Cloud Run or Stape.io.</td>
        </tr>
        <tr>
          <td><strong>Cost for User</strong></td>
          <td><strong>$0 / month</strong> (included in GTMObserver plan).</td>
          <td><strong>$5 - $20 / month</strong> (Cloud Run) or <strong>$20 / month</strong> (Stape.io).</td>
        </tr>
        <tr>
          <td><strong>User Setup Complexity</strong></td>
          <td><strong>1-Click:</strong> User pastes Meta Pixel ID & CAPI Token into GTMObserver.</td>
          <td><strong>Medium to High:</strong> Requires GCP billing setup or Stape subscription.</td>
        </tr>
        <tr>
          <td><strong>Supported Destinations</strong></td>
          <td>Meta CAPI, GA4 Measurement Protocol, TikTok Events API.</td>
          <td>Unlimited (any sGTM community tag template).</td>
        </tr>
        <tr>
          <td><strong>Maintenance</strong></td>
          <td>Zero maintenance; runs on Cloudflare's globally distributed edge.</td>
          <td>Requires monitoring container instances, CPU quotas, and GCP credentials.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="callout-box info avoid-break">
    <div class="callout-title">Strategic Recommendation: Implement Path A First, Offer Path B for Enterprise</div>
    <strong>Path A (Cloudflare Workers CAPI Gateway)</strong> gives GTMObserver a massive unfair advantage over competitors: you can offer server-side Meta CAPI and GA4 tracking to standard users with zero added server infrastructure cost. For advanced enterprise clients requiring full sGTM container management, integrate Path B via the Stape API or Google Cloud Run.
  </div>

  <!-- SECTION 4 -->
  <div class="avoid-break">
    <h2>4. Technical Blueprint: Edge-Native Meta CAPI Implementation</h2>
    <p>Below is the exact production architecture used to run server-side Meta Conversions API directly inside Cloudflare Workers without requiring Google Cloud:</p>

    <div class="code-block">
<span class="code-comment">// Cloudflare Worker Edge Handler: /api/collect</span>
<span class="code-keyword">export async function</span> <span class="code-string">onRequestPost</span>({ request, env }) {
  <span class="code-keyword">const</span> body = <span class="code-keyword">await</span> request.json();
  <span class="code-keyword">const</span> { eventName, eventId, email, phone, customData } = body;

  <span class="code-comment">// 1. Hash PII (SHA-256) at the Edge</span>
  <span class="code-keyword">const</span> hashedEmail = email ? <span class="code-keyword">await</span> sha256(email.trim().toLowerCase()) : <span class="code-keyword">null</span>;
  <span class="code-keyword">const</span> hashedPhone = phone ? <span class="code-keyword">await</span> sha256(phone.trim().replace(/\\D/g, <span class="code-string">''</span>)) : <span class="code-keyword">null</span>;

  <span class="code-comment">// 2. Dispatch Server-to-Server to Meta CAPI</span>
  <span class="code-keyword">const</span> metaRes = <span class="code-keyword">await</span> fetch(<span class="code-string">\`https://graph.facebook.com/v21.0/\${env.META_PIXEL_ID}/events\`</span>, {
    method: <span class="code-string">'POST'</span>,
    headers: { <span class="code-string">'Content-Type'</span>: <span class="code-string">'application/json'</span> },
    body: JSON.stringify({
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId, <span class="code-comment">// Deduplicates with client-side Meta Pixel</span>
        action_source: <span class="code-string">'website'</span>,
        user_data: {
          em: hashedEmail ? [hashedEmail] : <span class="code-keyword">undefined</span>,
          ph: hashedPhone ? [hashedPhone] : <span class="code-keyword">undefined</span>,
          client_ip_address: request.headers.get(<span class="code-string">'CF-Connecting-IP'</span>),
          client_user_agent: request.headers.get(<span class="code-string">'user-agent'</span>)
        },
        custom_data: customData
      }],
      access_token: env.META_CAPI_TOKEN
    })
  });

  <span class="code-keyword">return new</span> Response(JSON.stringify(<span class="code-keyword">await</span> metaRes.json()), { status: 200 });
}
    </div>
  </div>

  <!-- PAGE BREAK -->
  <div class="page-break"></div>

  <!-- SECTION 5 -->
  <h2>5. Event Deduplication Architecture (Crucial)</h2>
  
  <p>When running a hybrid tracking model (both Browser Pixel and Server CAPI active simultaneously), <strong>event deduplication</strong> is mandatory to prevent platforms like Meta and Google Ads from double-counting purchases and leads.</p>

  <div class="avoid-break">
    <h3>The 3-Step Deduplication Standard:</h3>
    <ol>
      <li><strong>Client-Side ID Generation:</strong> GTM generates a unique <code>event_id</code> on the client side whenever an action occurs (e.g., using a combination of Unix timestamp and a random string: <code>Date.now() + '.' + Math.random().toString(36).substring(2, 9)</code>).</li>
      <li><strong>Browser Pixel Dispatch:</strong> The client-side Meta Pixel fires: <code>fbq('track', 'Purchase', { ... }, { eventID: event_id });</code>.</li>
      <li><strong>Server-Side CAPI Dispatch:</strong> The server forwards the identical <code>event_id</code> inside the payload's <code>data[0].event_id</code> attribute. Meta's deduplication engine matches both events within a 48-hour window and merges them, ensuring 100% accurate conversion counting with full server-side attribution enrichment.</li>
    </ol>
  </div>

  <!-- SECTION 6 -->
  <div class="avoid-break">
    <h2>6. Three-Phase Product Implementation Roadmap</h2>

    <table>
      <thead>
        <tr>
          <th>Phase</th>
          <th>Feature Deliverables</th>
          <th>Estimated Effort</th>
          <th>Commercial Impact</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Phase 1<br>(Immediate)</strong></td>
          <td>
            &bull; Google Consent Mode v2 Default Recipe.<br>
            &bull; Google Ads Enhanced Conversions & Conversion Linker.<br>
            &bull; Meta Pixel with Automatic Advanced Matching.
          </td>
          <td>1 - 2 Sprints</td>
          <td>Instantly eliminates GDPR/DMA non-compliance risk; unlocks core paid media agencies.</td>
        </tr>
        <tr>
          <td><strong>Phase 2<br>(Server-Side)</strong></td>
          <td>
            &bull; Edge-Native Meta CAPI Gateway on Cloudflare Workers.<br>
            &bull; Automatic <code>event_id</code> deduplication recipe in GTM.<br>
            &bull; GA4 Measurement Protocol server-side forwarding.
          </td>
          <td>2 - 3 Sprints</td>
          <td>Major marketing differentiator: "Server-side tracking with zero GCP/Stape monthly hosting costs."</td>
        </tr>
        <tr>
          <td><strong>Phase 3<br>(E-Commerce & Scale)</strong></td>
          <td>
            &bull; Shopify Web Pixels API tracking suite.<br>
            &bull; Calendly & meeting booking postMessage listeners.<br>
            &bull; Optional Stape API integration for enterprise sGTM.
          </td>
          <td>3 - 4 Sprints</td>
          <td>Captures the massive Shopify merchant market and B2B SaaS lead generation agencies.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="avoid-break">
    <h2>7. Implementation Checklist for GTMObserver</h2>
    <ul>
      <li>[ ] <strong>Consent Mode v2:</strong> Add <code>consent_default</code> tag template setting all four consent flags to denied.</li>
      <li>[ ] <strong>Meta Pixel & CAPI:</strong> Create <code>basic_meta_pixel</code> and <code>server_meta_capi</code> module templates with <code>event_id</code>.</li>
      <li>[ ] <strong>Google Ads:</strong> Add <code>conversion_linker</code> and <code>google_ads_enhanced_conversion</code> templates.</li>
      <li>[ ] <strong>Shopify Suite:</strong> Build customer events webhook / web pixel script generator.</li>
      <li>[ ] <strong>Cloudflare Worker:</strong> Expose <code>/api/collect</code> route with SHA-256 PII hashing and Meta Graph API dispatch.</li>
      <li>[ ] <strong>Observer Anomaly Rules:</strong> Add GA4 anomaly rules for <em>Consent Drop-off Rate</em> and <em>Server vs. Client Event Ratio</em>.</li>
    </ul>
  </div>

  <div class="footer-note">
    &copy; ${new Date().getFullYear()} GTMObserver. All rights reserved. &bull; Confidential Engineering Specification
  </div>

</body>
</html>`;

const tmpHtmlPath = path.join(process.cwd(), 'temp_blueprint.html');
const outputPdfPath = path.join(process.cwd(), 'GTMObserver-Tracking-Architecture-Blueprint.pdf');
const publicPdfPath = path.join(process.cwd(), 'public/GTMObserver-Tracking-Architecture-Blueprint.pdf');
const artifactPdfPath = '/Users/mdatiarrahmanovi/.gemini/antigravity/brain/7fbfefcf-939d-4122-b9ed-281d5659d67b/GTMObserver-Tracking-Architecture-Blueprint.pdf';

fs.writeFileSync(tmpHtmlPath, htmlContent);

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "${tmpHtmlPath}"`;

console.log('Generating PDF via Google Chrome...');
execSync(cmd);

// Copy to public directory so user can also open it via URL
fs.copyFileSync(outputPdfPath, publicPdfPath);
// Copy to artifacts directory
fs.copyFileSync(outputPdfPath, artifactPdfPath);

// Cleanup temp HTML
fs.unlinkSync(tmpHtmlPath);

console.log('PDF Generated Successfully!');
console.log('Output path:', outputPdfPath);
console.log('Public path:', publicPdfPath);
console.log('Artifact path:', artifactPdfPath);
