export type AuditSeverity = 'critical' | 'warning' | 'info' | 'passed';

export type AuditCategory =
  | 'Cross-Domain & Referrals'
  | 'Integrations & Links'
  | 'Property Configuration'
  | 'Data Quality & Privacy'
  | 'Conversions & Events';

export interface Ga4AuditFinding {
  id: string;
  category: AuditCategory;
  severity: AuditSeverity;
  title: string;
  description: string;
  evidence: string[];
  fixSteps: string[];
  penalty: number;
}

export interface Ga4IntegrationStatus {
  id: string;
  name: string;
  category: 'SEO' | 'Paid Media' | 'Data Warehouse' | 'Audience & Signals' | 'Measurement';
  status: 'linked' | 'missing' | 'unavailable';
  summary: string;
  details: string[];
  actionHint?: string;
}

export interface Ga4AuditRawSnapshot {
  property: {
    name: string;
    displayName: string;
    timeZone?: string;
    currencyCode?: string;
    industryCategory?: string;
    createTime?: string;
  };
  dataStreams: Array<{
    name: string;
    displayName?: string;
    type?: string;
    measurementId?: string;
    defaultUri?: string;
  }>;
  dataRetention?: {
    eventDataRetention?: string;
    resetUserDataOnNewActivity?: boolean;
  } | null;
  enhancedMeasurement?: {
    streamEnabled?: boolean;
    scrollsEnabled?: boolean;
    outboundClicksEnabled?: boolean;
    siteSearchEnabled?: boolean;
    videoEngagementEnabled?: boolean;
    fileDownloadsEnabled?: boolean;
    pageChangesEnabled?: boolean;
    formInteractionsEnabled?: boolean;
  } | null;
  googleSignals?: {
    state?: string;
    consent?: string;
  } | null;
  attribution?: {
    acquisitionConversionEventLookbackWindow?: string;
    otherConversionEventLookbackWindow?: string;
    reportingAttributionModel?: string;
  } | null;
  links: {
    googleAds: Array<{ customerId?: string; creatorEmailAddress?: string; adsPersonalizationEnabled?: boolean }> | null;
    searchConsole: Array<{ siteUrl?: string; dataStreamId?: string }> | null;
    bigQuery: Array<{ project?: string; dailyExportEnabled?: boolean; streamingExportEnabled?: boolean; datasetLocation?: string }> | null;
    dv360: Array<{ advertiserId?: string; advertiserDisplayName?: string }> | null;
    sa360: Array<{ advertiserId?: string; advertiserDisplayName?: string }> | null;
    adSense: Array<{ adClientCode?: string }> | null;
    measurementProtocolSecretsCount: number | null;
  };
  keyEvents: Array<{
    eventName: string;
    countingMethod?: string;
  }> | null;
  customDimensions: Array<{
    parameterName: string;
    displayName?: string;
    scope?: string;
  }> | null;
  customMetrics: Array<{
    parameterName: string;
    displayName?: string;
  }> | null;
  telemetry30d: {
    totals: {
      sessions: number;
      activeUsers: number;
      totalUsers: number;
      eventCount: number;
      screenPageViews: number;
      keyEvents: number;
      transactions: number;
      totalRevenue: number;
      bounceRate: number;
      engagementRate: number;
      averageSessionDuration: number;
    };
    channels: Array<{
      channel: string;
      sessions: number;
      keyEvents: number;
      revenue: number;
    }>;
    referrals: Array<{
      source: string;
      medium: string;
      sessions: number;
      keyEvents: number;
      transactions: number;
      revenue: number;
    }>;
    hostnames: Array<{
      hostName: string;
      sessions: number;
      screenPageViews: number;
    }>;
    events: Array<{
      eventName: string;
      eventCount: number;
      totalUsers: number;
    }>;
    pages: Array<{
      pagePathPlusQueryString: string;
      screenPageViews: number;
    }>;
    landingPages: Array<{
      landingPage: string;
      sessions: number;
    }>;
  };
  apiAccessNotes?: string[];
}

export interface Ga4AuditReport {
  generatedAt: string;
  healthScore: number;
  grade: 'Excellent' | 'Good' | 'Needs Attention' | 'Critical';
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    passedCount: number;
    totalChecks: number;
  };
  propertyMeta: {
    propertyId: string;
    displayName: string;
    measurementId: string;
    defaultUri: string;
    rootDomain: string;
    timeZone: string;
    currencyCode: string;
    industryCategory: string;
    dataRetention: string;
    resetUserDataOnNewActivity: boolean | null;
    attributionModel: string;
    eventCustomDimUsed: number;
    userCustomDimUsed: number;
    customMetricsCount: number;
    totals30d: Ga4AuditRawSnapshot['telemetry30d']['totals'];
  };
  integrations: Ga4IntegrationStatus[];
  findings: Ga4AuditFinding[];
  forensics: {
    referrals: Array<{
      source: string;
      medium: string;
      sessions: number;
      keyEvents: number;
      transactions: number;
      revenue: number;
      flag: 'self_referral' | 'booking_engine' | 'payment_gateway' | 'normal';
    }>;
    hostnames: Array<{
      hostName: string;
      rootDomain: string;
      sessions: number;
      screenPageViews: number;
      flag: 'staging_dev' | 'normal';
    }>;
    channels: Array<{
      channel: string;
      sessions: number;
      sharePct: number;
      keyEvents: number;
      revenue: number;
      flag: 'unassigned' | 'high_direct' | 'normal';
    }>;
    keyEventsStatus: Array<{
      eventName: string;
      countingMethod: string;
      count30d: number;
      status: 'firing' | 'inactive' | 'noisy';
    }>;
    topEvents: Array<{
      eventName: string;
      eventCount: number;
      totalUsers: number;
      namingOk: boolean;
      isStandard: boolean;
    }>;
    streams: Ga4AuditRawSnapshot['dataStreams'];
  };
  apiAccessNotes: string[];
}

export const BOOKING_ENGINE_DOMAINS = [
  'synxis.com',
  'ihotelier.com',
  'mews.com',
  'windsurfercrs.com',
  'verticalbooking.com',
  'cloudbeds.com',
  'book-directonline.com',
  'siteminder.com',
  'sabre.com',
  'safara.com',
  'reservhotel.com',
  'opentable.com',
  'resy.com',
  'toasttab.com',
  'stayntouch.com',
  'guesty.com',
  'lodgify.com',
  'bookassist.com',
  'shrgroup.com',
  'travelclick.com'
];

export const PAYMENT_GATEWAY_DOMAINS = [
  'paypal.com',
  'stripe.com',
  'shop.app',
  'pay.shopify.com',
  'klarna.com',
  'afterpay.com',
  'affirm.com',
  'authorize.net',
  'braintreegateway.com',
  'adyen.com',
  'squareup.com',
  'checkout.com',
  'worldpay.com',
  'razorpay.com',
  '2checkout.com'
];

export const NOISY_KEY_EVENTS = new Set([
  'page_view',
  'session_start',
  'first_visit',
  'user_engagement',
  'scroll'
]);

export const STANDARD_GA4_EVENTS = new Set([
  'page_view',
  'session_start',
  'first_visit',
  'user_engagement',
  'scroll',
  'click',
  'view_search_results',
  'file_download',
  'video_start',
  'video_progress',
  'video_complete',
  'form_start',
  'form_submit',
  'view_item',
  'view_item_list',
  'select_item',
  'add_to_cart',
  'remove_from_cart',
  'view_cart',
  'begin_checkout',
  'add_shipping_info',
  'add_payment_info',
  'purchase',
  'refund',
  'generate_lead',
  'sign_up',
  'login',
  'search',
  'share'
]);

const TWO_PART_TLDS = new Set([
  'co.uk',
  'org.uk',
  'ac.uk',
  'com.au',
  'net.au',
  'org.au',
  'co.nz',
  'com.br',
  'co.in',
  'co.jp',
  'com.mx',
  'co.za'
]);

export function extractRootDomain(uriOrHost?: string | null): string {
  if (!uriOrHost || typeof uriOrHost !== 'string') return '';
  let raw = uriOrHost.trim().toLowerCase();
  if (!raw || raw === '(not set)' || raw === '(direct)') return '';

  try {
    if (raw.includes('://')) {
      raw = new URL(raw).hostname;
    } else {
      raw = raw.split('/')[0].split('?')[0];
    }
  } catch (_) {
    raw = raw.split('/')[0].split('?')[0];
  }

  // Remove port
  raw = raw.split(':')[0].replace(/^www\./, '');
  if (!raw) return '';

  const parts = raw.split('.').filter(Boolean);
  if (parts.length <= 2) return parts.join('.');

  const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  if (TWO_PART_TLDS.has(lastTwo) && parts.length >= 3) {
    return `${parts[parts.length - 3]}.${lastTwo}`;
  }
  return lastTwo;
}

function matchesDomainList(source: string, domainList: string[]): string | null {
  const s = (source || '').trim().toLowerCase();
  if (!s) return null;
  for (const d of domainList) {
    if (s === d || s.endsWith(`.${d}`) || s.includes(d)) {
      return d;
    }
  }
  return null;
}

function redactEmail(emailStr: string): string {
  const normalized = emailStr.replace(/%40/gi, '@');
  const atIdx = normalized.indexOf('@');
  if (atIdx <= 0) return '[REDACTED_EMAIL]';
  const local = normalized.slice(0, atIdx);
  const domain = normalized.slice(atIdx + 1);
  return `${local[0]}***@${domain}`;
}

function sanitizeUrlForEvidence(rawUrl: string): string {
  let clean = rawUrl.replace(
    /[a-zA-Z0-9._%+-]+(?:@|%40)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    m => redactEmail(m)
  );
  clean = clean.replace(
    /([?&])(email|e-mail|phone|tel|mobile|first_name|last_name|full_name|password|passwd|ssn)=([^&]+)/gi,
    '$1$2=[REDACTED]'
  );
  return clean;
}

function formatRetentionLabel(code?: string): string {
  switch (code) {
    case 'TWO_MONTHS':
      return '2 Months';
    case 'FOURTEEN_MONTHS':
      return '14 Months';
    case 'TWENTY_SIX_MONTHS':
      return '26 Months';
    case 'THIRTY_EIGHT_MONTHS':
      return '38 Months';
    case 'FIFTY_MONTHS':
      return '50 Months';
    default:
      return code ? code.replace(/_/g, ' ') : 'Unavailable';
  }
}

export function analyzeGa4AuditSnapshot(snapshot: Ga4AuditRawSnapshot): Ga4AuditReport {
  const findings: Ga4AuditFinding[] = [];
  const webStreams = (snapshot.dataStreams || []).filter(
    s => s.type === 'WEB_DATA_STREAM' || Boolean(s.measurementId) || Boolean(s.defaultUri)
  );
  const primaryStream = webStreams[0] || snapshot.dataStreams?.[0];
  const defaultUri = primaryStream?.defaultUri || '';
  const rootDomain = extractRootDomain(defaultUri);

  const totals = snapshot.telemetry30d?.totals || {
    sessions: 0,
    activeUsers: 0,
    totalUsers: 0,
    eventCount: 0,
    screenPageViews: 0,
    keyEvents: 0,
    transactions: 0,
    totalRevenue: 0,
    bounceRate: 0,
    engagementRate: 0,
    averageSessionDuration: 0
  };
  const channels = snapshot.telemetry30d?.channels || [];
  const referrals = snapshot.telemetry30d?.referrals || [];
  const hostnames = snapshot.telemetry30d?.hostnames || [];
  const events = snapshot.telemetry30d?.events || [];
  const pages = snapshot.telemetry30d?.pages || [];
  const landingPages = snapshot.telemetry30d?.landingPages || [];

  // =========================================================================
  // CATEGORY 1: CROSS-DOMAIN & REFERRALS
  // =========================================================================

  // Build classified forensics referrals first
  const classifiedReferrals = referrals.map(ref => {
    const refRoot = extractRootDomain(ref.source);
    let flag: 'self_referral' | 'booking_engine' | 'payment_gateway' | 'normal' = 'normal';
    if (rootDomain && (refRoot === rootDomain || ref.source.toLowerCase().includes(rootDomain))) {
      flag = 'self_referral';
    } else if (matchesDomainList(ref.source, BOOKING_ENGINE_DOMAINS)) {
      flag = 'booking_engine';
    } else if (matchesDomainList(ref.source, PAYMENT_GATEWAY_DOMAINS)) {
      flag = 'payment_gateway';
    }
    return {
      ...ref,
      flag
    };
  });

  // 1. Self-Referral Leak
  const selfRefs = classifiedReferrals.filter(r => r.flag === 'self_referral');
  if (selfRefs.length > 0) {
    findings.push({
      id: 'cross_domain_self_referral',
      category: 'Cross-Domain & Referrals',
      severity: 'critical',
      title: 'Self-Referral Attribution Leak Detected',
      description: `Your own domain (${rootDomain}) is appearing as a referral traffic source in the last 30 days. This breaks session continuity, resets attribution to "Referral", and steals credit from Organic Search and Paid Ads.`,
      evidence: selfRefs.slice(0, 8).map(
        r => `${r.source} (${r.sessions.toLocaleString()} sessions, ${r.keyEvents.toLocaleString()} key events, $${r.revenue.toFixed(2)} rev)`
      ),
      fixSteps: [
        `Open GA4 Admin → Data Streams → Select your Web Stream → Configure tag settings → Configure your domains.`,
        `Ensure ${rootDomain} and all active subdomains/partner booking domains are listed under "Include domains that match".`,
        `Under "Show more → List unwanted referrals", add ${rootDomain} and verify the GTM GA4 tag fires consistently on every page.`
      ],
      penalty: 15
    });
  } else {
    findings.push({
      id: 'cross_domain_self_referral',
      category: 'Cross-Domain & Referrals',
      severity: 'passed',
      title: 'No Self-Referral Leaks Found',
      description: rootDomain
        ? `No self-referrals matching your property domain (${rootDomain}) were detected across top referral sources in the last 30 days.`
        : 'No self-referral anomalies detected across top referral sources.',
      evidence: [],
      fixSteps: [],
      penalty: 0
    });
  }

  // 2. Booking Engine & Payment Gateway Referral Leak
  const gatewayRefs = classifiedReferrals.filter(
    r => r.flag === 'booking_engine' || r.flag === 'payment_gateway'
  );
  if (gatewayRefs.length > 0) {
    const hasBooking = gatewayRefs.some(r => r.flag === 'booking_engine');
    const hasPayment = gatewayRefs.some(r => r.flag === 'payment_gateway');
    const labelType = hasBooking && hasPayment
      ? 'Booking Engines & Payment Gateways'
      : hasBooking
        ? 'Booking Engines (Hospitality CRS)'
        : 'Payment Gateways';

    findings.push({
      id: 'cross_domain_gateway_leak',
      category: 'Cross-Domain & Referrals',
      severity: 'critical',
      title: `Cross-Domain Attribution Leak via ${labelType}`,
      description: `Third-party checkout or reservation domains are hijacking conversion credit as referrals when visitors return to your confirmation page. Original marketing source (Google Ads, Organic, Email) is lost on converted sessions.`,
      evidence: gatewayRefs.slice(0, 10).map(
        r => `[${r.flag === 'booking_engine' ? 'Booking Engine' : 'Payment Gateway'}] ${r.source} — ${r.sessions.toLocaleString()} sessions, ${r.transactions.toLocaleString()} txns, $${r.revenue.toFixed(2)} revenue`
      ),
      fixSteps: [
        'For third-party Payment Gateways (PayPal, Stripe, Klarna, Shop Pay): GA4 Admin → Data Streams → Configure tag settings → Show more → List unwanted referrals → add the gateway domains.',
        'For Hospitality Booking Engines you control (SynXis, iHotelier, Mews, Windsurfer, Cloudbeds): ensure GTM + Measurement ID matches AND add both your hotel domain + booking engine domain in "Configure your domains" so the _gl cross-domain linker parameter passes seamlessly.'
      ],
      penalty: 15
    });
  } else {
    findings.push({
      id: 'cross_domain_gateway_leak',
      category: 'Cross-Domain & Referrals',
      severity: 'passed',
      title: 'No Booking Engine or Payment Gateway Leaks',
      description: 'None of the known reservation engines (SynXis, Mews, iHotelier, Cloudbeds) or payment gateways (PayPal, Stripe, Klarna, etc.) appeared as attribution-stealing referrals.',
      evidence: [],
      fixSteps: [],
      penalty: 0
    });
  }

  // 3. Hostname Hygiene & Staging Pollution
  const STAGING_HOST_PATTERNS = [
    'localhost',
    '127.0.0.1',
    'staging.',
    'dev.',
    'test.',
    'preview.',
    'vercel.app',
    'netlify.app',
    'pages.dev',
    'gtm-msr.appspot.com',
    'translate.googleusercontent.com'
  ];
  const classifiedHostnames = hostnames.map(h => {
    const lower = (h.hostName || '').toLowerCase();
    const isDirty = STAGING_HOST_PATTERNS.some(pat => lower.includes(pat));
    return {
      hostName: h.hostName,
      rootDomain: extractRootDomain(h.hostName) || lower,
      sessions: h.sessions,
      screenPageViews: h.screenPageViews,
      flag: (isDirty ? 'staging_dev' : 'normal') as 'staging_dev' | 'normal'
    };
  });
  const dirtyHosts = classifiedHostnames.filter(h => h.flag === 'staging_dev');
  const distinctRootDomains = new Set(
    classifiedHostnames.map(h => h.rootDomain).filter(d => d && d !== '(not set)')
  );

  if (dirtyHosts.length > 0) {
    findings.push({
      id: 'hostname_pollution',
      category: 'Cross-Domain & Referrals',
      severity: 'warning',
      title: 'Staging, Localhost, or Preview Hostname Pollution',
      description: 'Non-production domains or developer environments are sending live hits into this production GA4 property, skewing traffic and conversion rates.',
      evidence: dirtyHosts.map(
        h => `${h.hostName} (${h.sessions.toLocaleString()} sessions, ${h.screenPageViews.toLocaleString()} pageviews)`
      ),
      fixSteps: [
        'In GA4 Admin → Data Settings → Data Filters, configure an active Developer Traffic filter or block GTM on staging environments.',
        'In GTM, route staging/localhost environments to a dedicated Staging GA4 Measurement ID using a Lookup Table variable on {{Page Hostname}}.'
      ],
      penalty: 6
    });
  } else if (distinctRootDomains.size > 3) {
    findings.push({
      id: 'hostname_pollution',
      category: 'Cross-Domain & Referrals',
      severity: 'info',
      title: `Multiple Root Domains Reporting (${distinctRootDomains.size} Domains)`,
      description: 'More than 3 distinct root domains are reporting into this stream. Verify whether this is an intentional multi-brand/cross-domain property or scraped tag usage.',
      evidence: Array.from(distinctRootDomains).slice(0, 8),
      fixSteps: [
        'Confirm each listed domain belongs to your organization and is included in GA4 Cross-Domain Settings if users navigate between them.'
      ],
      penalty: 0
    });
  } else {
    findings.push({
      id: 'hostname_pollution',
      category: 'Cross-Domain & Referrals',
      severity: 'passed',
      title: 'Clean Production Hostname Hygiene',
      description: 'No localhost, staging, preview, or unexpected scraper hostnames detected in the last 30 days.',
      evidence: classifiedHostnames.slice(0, 4).map(h => `${h.hostName} (${h.sessions.toLocaleString()} sessions)`),
      fixSteps: [],
      penalty: 0
    });
  }

  // =========================================================================
  // CATEGORY 2: INTEGRATIONS & PRODUCT LINKS
  // =========================================================================

  // 4. Google Search Console Link
  const gscLinks = snapshot.links?.searchConsole;
  if (gscLinks === null) {
    findings.push({
      id: 'link_gsc',
      category: 'Integrations & Links',
      severity: 'info',
      title: 'Google Search Console Link Status Unavailable',
      description: 'The GA4 Admin API did not return Search Console link status for this property (insufficient permission or alpha endpoint disabled).',
      evidence: [],
      fixSteps: ['Verify manually in GA4 Admin → Product Links → Search Console Links.'],
      penalty: 0
    });
  } else if (gscLinks.length === 0) {
    findings.push({
      id: 'link_gsc',
      category: 'Integrations & Links',
      severity: 'warning',
      title: 'Google Search Console (GSC) Is Not Linked',
      description: 'No Search Console property is connected to this GA4 property. Organic search query rankings, impressions, and CTR data are missing inside GA4.',
      evidence: ['0 linked Search Console properties'],
      fixSteps: [
        'Open GA4 Admin → Product Links → Search Console Links → Click Link.',
        'Select your verified Search Console domain property and bind it to your primary Web Data Stream.',
        'Publish the "Search Console" collection inside GA4 Reports → Library.'
      ],
      penalty: 8
    });
  } else {
    findings.push({
      id: 'link_gsc',
      category: 'Integrations & Links',
      severity: 'passed',
      title: 'Google Search Console Linked',
      description: `Connected to ${gscLinks.length} verified Search Console site(s) for organic search query reporting.`,
      evidence: gscLinks.map(l => l.siteUrl || l.dataStreamId || 'Linked Search Console Site'),
      fixSteps: [],
      penalty: 0
    });
  }

  // 5. Google Ads Link
  const adsLinks = snapshot.links?.googleAds;
  const paidSearchChannel = channels.find(c => (c.channel || '').toLowerCase() === 'paid search');
  const paidSearchSessions = paidSearchChannel?.sessions || 0;

  if (adsLinks === null) {
    findings.push({
      id: 'link_google_ads',
      category: 'Integrations & Links',
      severity: 'info',
      title: 'Google Ads Link Status Unavailable',
      description: 'Google Ads link metadata could not be read with the current token permissions.',
      evidence: [],
      fixSteps: ['Check manually under GA4 Admin → Product Links → Google Ads Links.'],
      penalty: 0
    });
  } else if (adsLinks.length === 0) {
    if (paidSearchSessions > 0) {
      findings.push({
        id: 'link_google_ads',
        category: 'Integrations & Links',
        severity: 'critical',
        title: 'Google Ads Link Missing While Paid Search Traffic Is Active',
        description: `Detected ${paidSearchSessions.toLocaleString()} Paid Search sessions in the last 30 days, but no Google Ads account is linked. Campaign cost, click attribution, and GA4 audience/bidding imports are broken.`,
        evidence: [
          '0 linked Google Ads accounts',
          `Paid Search traffic detected: ${paidSearchSessions.toLocaleString()} sessions`
        ],
        fixSteps: [
          'Open GA4 Admin → Product Links → Google Ads Links → Click Link.',
          'Select your Google Ads Customer ID, enable Personalized Advertising and Auto-Tagging (gclid).',
          'Import your primary GA4 Key Events into Google Ads Conversions for Smart Bidding.'
        ],
        penalty: 12
      });
    } else {
      findings.push({
        id: 'link_google_ads',
        category: 'Integrations & Links',
        severity: 'warning',
        title: 'Google Ads Account Is Not Linked',
        description: 'No Google Ads account is linked to this property. Linking enables remarketing audience sharing and future CPC cost attribution.',
        evidence: ['0 linked Google Ads accounts', '0 Paid Search sessions recorded in last 30 days'],
        fixSteps: [
          'If you run or plan to run Google Ads, navigate to GA4 Admin → Product Links → Google Ads Links and connect your Ads account.'
        ],
        penalty: 5
      });
    }
  } else {
    const personalizationDisabled = adsLinks.some(a => a.adsPersonalizationEnabled === false);
    findings.push({
      id: 'link_google_ads',
      category: personalizationDisabled ? 'Integrations & Links' : 'Integrations & Links',
      severity: 'passed',
      title: 'Google Ads Account Linked',
      description: `Connected to ${adsLinks.length} Google Ads account(s)${personalizationDisabled ? ' (note: Ads Personalization is disabled on at least one link)' : ''}.`,
      evidence: adsLinks.map(
        a => `Customer ID: ${a.customerId || 'Unknown'} • Ads Personalization: ${a.adsPersonalizationEnabled === false ? 'Disabled' : 'Enabled'}`
      ),
      fixSteps: personalizationDisabled
        ? ['Review whether Personalized Advertising should be enabled on your Google Ads link so GA4 remarketing audiences populate.']
        : [],
      penalty: 0
    });
  }

  // 6. BigQuery Export Link
  const bqLinks = snapshot.links?.bigQuery;
  if (bqLinks === null) {
    findings.push({
      id: 'link_bigquery',
      category: 'Integrations & Links',
      severity: 'info',
      title: 'BigQuery Export Status Unavailable',
      description: 'BigQuery export links could not be queried with the current API access.',
      evidence: [],
      fixSteps: ['Check manually under GA4 Admin → Product Links → BigQuery Links.'],
      penalty: 0
    });
  } else if (bqLinks.length === 0) {
    findings.push({
      id: 'link_bigquery',
      category: 'Integrations & Links',
      severity: 'warning',
      title: 'BigQuery Raw Event Export Not Configured',
      description: 'GA4 automatically purges user-level exploration data after 2–14 months. Without BigQuery export, unsampled raw hit-level history cannot be preserved.',
      evidence: ['0 BigQuery export links configured'],
      fixSteps: [
        'Open GA4 Admin → Product Links → BigQuery Links → Click Link.',
        'Connect a Google Cloud Project with BigQuery API enabled (free tier covers up to 1M events/day via Daily Export).'
      ],
      penalty: 5
    });
  } else {
    findings.push({
      id: 'link_bigquery',
      category: 'Integrations & Links',
      severity: 'passed',
      title: 'BigQuery Raw Export Configured',
      description: `Connected to ${bqLinks.length} BigQuery export link(s) for permanent unsampled event storage.`,
      evidence: bqLinks.map(
        b => `${b.project || 'GCP Project'} (Daily: ${b.dailyExportEnabled ? 'On' : 'Off'}, Streaming: ${b.streamingExportEnabled ? 'On' : 'Off'})`
      ),
      fixSteps: [],
      penalty: 0
    });
  }

  // 7. Google Signals
  const signals = snapshot.googleSignals;
  if (!signals) {
    findings.push({
      id: 'google_signals',
      category: 'Integrations & Links',
      severity: 'info',
      title: 'Google Signals Status Unavailable',
      description: 'Google Signals configuration could not be retrieved via Admin v1alpha API.',
      evidence: [],
      fixSteps: ['Check GA4 Admin → Data Collection and Modification → Data Collection → Google Signals.'],
      penalty: 0
    });
  } else if (signals.state === 'GOOGLE_SIGNALS_ENABLED') {
    findings.push({
      id: 'google_signals',
      category: 'Integrations & Links',
      severity: 'passed',
      title: 'Google Signals Enabled',
      description: 'Google Signals is active, enabling cross-device user modeling, demographics, and Ads remarketing audiences.',
      evidence: [`State: ${signals.state}`],
      fixSteps: [],
      penalty: 0
    });
  } else {
    findings.push({
      id: 'google_signals',
      category: 'Integrations & Links',
      severity: 'warning',
      title: 'Google Signals Is Disabled',
      description: 'Cross-device identity resolution and demographic/interest reporting are unavailable without Google Signals.',
      evidence: [`Current state: ${signals.state || 'NOT_ENABLED'}`],
      fixSteps: [
        'Go to GA4 Admin → Data Collection and Modification → Data Collection.',
        'Turn ON Google Signals data collection and acknowledge user-data disclosure requirements.'
      ],
      penalty: 5
    });
  }

  // Build Structured Integrations Matrix (9 items)
  const integrations: Ga4IntegrationStatus[] = [
    {
      id: 'gsc',
      name: 'Google Search Console',
      category: 'SEO',
      status: gscLinks === null ? 'unavailable' : gscLinks.length > 0 ? 'linked' : 'missing',
      summary: gscLinks === null
        ? 'API permission unavailable'
        : gscLinks.length > 0
          ? `${gscLinks.length} property linked`
          : 'Not linked — SEO query data missing',
      details: gscLinks ? gscLinks.map(l => l.siteUrl || l.dataStreamId || 'Linked site') : [],
      actionHint: 'GA4 Admin → Product Links → Search Console Links'
    },
    {
      id: 'google_ads',
      name: 'Google Ads',
      category: 'Paid Media',
      status: adsLinks === null ? 'unavailable' : adsLinks.length > 0 ? 'linked' : 'missing',
      summary: adsLinks === null
        ? 'API permission unavailable'
        : adsLinks.length > 0
          ? `${adsLinks.length} account(s) linked`
          : paidSearchSessions > 0
            ? 'CRITICAL: Paid Search active with 0 links'
            : 'Not linked',
      details: adsLinks ? adsLinks.map(a => `Customer ${a.customerId || 'ID'}`) : [],
      actionHint: 'GA4 Admin → Product Links → Google Ads Links'
    },
    {
      id: 'bigquery',
      name: 'BigQuery Raw Export',
      category: 'Data Warehouse',
      status: bqLinks === null ? 'unavailable' : bqLinks.length > 0 ? 'linked' : 'missing',
      summary: bqLinks === null
        ? 'API permission unavailable'
        : bqLinks.length > 0
          ? `${bqLinks.length} project linked`
          : 'Not configured (14-month max retention risk)',
      details: bqLinks ? bqLinks.map(b => b.project || 'GCP Project') : [],
      actionHint: 'GA4 Admin → Product Links → BigQuery Links'
    },
    {
      id: 'google_signals',
      name: 'Google Signals',
      category: 'Audience & Signals',
      status: !signals ? 'unavailable' : signals.state === 'GOOGLE_SIGNALS_ENABLED' ? 'linked' : 'missing',
      summary: !signals
        ? 'API status unavailable'
        : signals.state === 'GOOGLE_SIGNALS_ENABLED'
          ? 'Enabled & collecting'
          : 'Disabled — no cross-device/demographics',
      details: signals?.state ? [signals.state] : [],
      actionHint: 'GA4 Admin → Data Collection → Google Signals'
    },
    {
      id: 'enhanced_measurement',
      name: 'Enhanced Measurement',
      category: 'Measurement',
      status: snapshot.enhancedMeasurement === null || snapshot.enhancedMeasurement === undefined
        ? 'unavailable'
        : snapshot.enhancedMeasurement.streamEnabled
          ? 'linked'
          : 'missing',
      summary: snapshot.enhancedMeasurement == null
        ? 'Stream setting unavailable'
        : snapshot.enhancedMeasurement.streamEnabled
          ? 'Active on primary Web Stream'
          : 'Disabled on primary Web Stream',
      details: snapshot.enhancedMeasurement
        ? [
            snapshot.enhancedMeasurement.scrollsEnabled ? 'Scrolls: On' : 'Scrolls: Off',
            snapshot.enhancedMeasurement.outboundClicksEnabled ? 'Outbound: On' : 'Outbound: Off',
            snapshot.enhancedMeasurement.formInteractionsEnabled ? 'Auto Forms: On (Review!)' : 'Auto Forms: Off'
          ]
        : [],
      actionHint: 'GA4 Admin → Data Streams → Enhanced Measurement'
    },
    {
      id: 'dv360',
      name: 'Display & Video 360',
      category: 'Paid Media',
      status: snapshot.links.dv360 === null ? 'unavailable' : snapshot.links.dv360.length > 0 ? 'linked' : 'missing',
      summary: snapshot.links.dv360 === null
        ? 'API status unavailable'
        : snapshot.links.dv360.length > 0
          ? `${snapshot.links.dv360.length} advertiser linked`
          : 'Not linked (Optional enterprise)',
      details: (snapshot.links.dv360 || []).map(d => d.advertiserDisplayName || d.advertiserId || 'DV360'),
      actionHint: 'GA4 Admin → Product Links → Display & Video 360'
    },
    {
      id: 'sa360',
      name: 'Search Ads 360',
      category: 'Paid Media',
      status: snapshot.links.sa360 === null ? 'unavailable' : snapshot.links.sa360.length > 0 ? 'linked' : 'missing',
      summary: snapshot.links.sa360 === null
        ? 'API status unavailable'
        : snapshot.links.sa360.length > 0
          ? `${snapshot.links.sa360.length} advertiser linked`
          : 'Not linked (Optional enterprise)',
      details: (snapshot.links.sa360 || []).map(s => s.advertiserDisplayName || s.advertiserId || 'SA360'),
      actionHint: 'GA4 Admin → Product Links → Search Ads 360'
    },
    {
      id: 'adsense',
      name: 'Google AdSense',
      category: 'Paid Media',
      status: snapshot.links.adSense === null ? 'unavailable' : snapshot.links.adSense.length > 0 ? 'linked' : 'missing',
      summary: snapshot.links.adSense === null
        ? 'API status unavailable'
        : snapshot.links.adSense.length > 0
          ? `${snapshot.links.adSense.length} link active`
          : 'Not linked (Publishers only)',
      details: (snapshot.links.adSense || []).map(a => a.adClientCode || 'AdSense'),
      actionHint: 'GA4 Admin → Product Links → AdSense Links'
    },
    {
      id: 'measurement_protocol',
      name: 'Measurement Protocol Secrets',
      category: 'Measurement',
      status: snapshot.links.measurementProtocolSecretsCount === null
        ? 'unavailable'
        : snapshot.links.measurementProtocolSecretsCount > 0
          ? 'linked'
          : 'missing',
      summary: snapshot.links.measurementProtocolSecretsCount === null
        ? 'Unavailable'
        : snapshot.links.measurementProtocolSecretsCount > 0
          ? `${snapshot.links.measurementProtocolSecretsCount} active server-side API secret(s)`
          : 'No server-side MP API secrets',
      details: [],
      actionHint: 'GA4 Admin → Data Streams → Measurement Protocol API Secrets'
    }
  ];

  // =========================================================================
  // CATEGORY 3: PROPERTY CONFIGURATION
  // =========================================================================

  // 8. Event Data Retention
  const retention = snapshot.dataRetention;
  if (!retention || !retention.eventDataRetention) {
    findings.push({
      id: 'data_retention',
      category: 'Property Configuration',
      severity: 'info',
      title: 'Event Data Retention Unavailable',
      description: 'Could not verify event-level data retention settings via Admin API.',
      evidence: [],
      fixSteps: ['Confirm retention is set to 14 months under GA4 Admin → Data Settings → Data Retention.'],
      penalty: 0
    });
  } else if (retention.eventDataRetention === 'TWO_MONTHS') {
    findings.push({
      id: 'data_retention',
      category: 'Property Configuration',
      severity: 'critical',
      title: 'Event Data Retention Set to Default 2 Months',
      description: 'Your GA4 Explore reports, Funnels, Path Explorations, and Segment queries delete event-level data after just 60 days — making YoY or quarterly funnel comparisons impossible.',
      evidence: [
        `Event Data Retention: ${formatRetentionLabel(retention.eventDataRetention)}`,
        `Reset user data on new activity: ${retention.resetUserDataOnNewActivity ? 'Enabled' : 'Disabled'}`
      ],
      fixSteps: [
        'Open GA4 Admin → Data Collection and Modification → Data Retention.',
        'Change Event Data Retention from "2 months" to "14 months" (or 26/38/50 months if on GA4 360).',
        'Ensure "Reset user data on new activity" is toggled ON and click Save.'
      ],
      penalty: 10
    });
  } else if (retention.resetUserDataOnNewActivity === false) {
    findings.push({
      id: 'data_retention',
      category: 'Property Configuration',
      severity: 'warning',
      title: 'Reset User Data on New Activity Disabled',
      description: `Event retention is ${formatRetentionLabel(retention.eventDataRetention)}, but "Reset user data on new activity" is turned OFF, which causes user properties/cohorts of returning users to expire prematurely.`,
      evidence: [
        `Event Data Retention: ${formatRetentionLabel(retention.eventDataRetention)}`,
        'Reset user data on new activity: Disabled'
      ],
      fixSteps: [
        'Navigate to GA4 Admin → Data Retention and toggle ON "Reset user data on new activity".'
      ],
      penalty: 3
    });
  } else {
    findings.push({
      id: 'data_retention',
      category: 'Property Configuration',
      severity: 'passed',
      title: `Event Data Retention Optimal (${formatRetentionLabel(retention.eventDataRetention)})`,
      description: 'Maximum standard retention and activity-based expiration reset are properly enabled.',
      evidence: [
        `Event Data Retention: ${formatRetentionLabel(retention.eventDataRetention)}`,
        'Reset user data on new activity: Enabled'
      ],
      fixSteps: [],
      penalty: 0
    });
  }

  // 9. Data Streams Architecture
  if (webStreams.length === 0) {
    findings.push({
      id: 'data_streams',
      category: 'Property Configuration',
      severity: 'critical',
      title: 'No Web Data Stream Configured',
      description: 'This GA4 property has zero active Web Data Streams, meaning website measurement tags cannot ingest browser traffic.',
      evidence: [`Total data streams found: ${(snapshot.dataStreams || []).length}`],
      fixSteps: ['Go to GA4 Admin → Data Streams → Add Stream → Web and deploy the generated G-XXXXXXXXXX Measurement ID via GTM.'],
      penalty: 15
    });
  } else if (webStreams.length > 1) {
    findings.push({
      id: 'data_streams',
      category: 'Property Configuration',
      severity: 'warning',
      title: `Multiple Web Data Streams Detected (${webStreams.length} Streams)`,
      description: 'Having more than one Web Data Stream inside the same GA4 property splits client IDs and breaks cross-domain session stitching.',
      evidence: webStreams.map(s => `${s.displayName || 'Stream'} (${s.measurementId || 'No ID'} — ${s.defaultUri || 'No URI'})`),
      fixSteps: [
        'Use ONE Web Data Stream per website/user journey and configure Cross-Domain Tracking under that single stream.',
        'Archive redundant web streams or move separate products into their own GA4 properties.'
      ],
      penalty: 6
    });
  } else {
    findings.push({
      id: 'data_streams',
      category: 'Property Configuration',
      severity: 'passed',
      title: 'Single Clean Web Data Stream Architecture',
      description: 'Property follows Google best practice with 1 consolidated Web Data Stream.',
      evidence: [`${primaryStream?.displayName || 'Primary Web Stream'} (${primaryStream?.measurementId || 'Active'} • ${defaultUri || 'Configured'})`],
      fixSteps: [],
      penalty: 0
    });
  }

  // 10. Enhanced Measurement & Form Tracking Trap
  const em = snapshot.enhancedMeasurement;
  if (!em) {
    findings.push({
      id: 'enhanced_measurement',
      category: 'Property Configuration',
      severity: 'info',
      title: 'Enhanced Measurement Settings Unavailable',
      description: 'Enhanced Measurement stream switches could not be inspected via Admin v1alpha API.',
      evidence: [],
      fixSteps: ['Inspect under GA4 Admin → Data Streams → Web Stream → Enhanced Measurement.'],
      penalty: 0
    });
  } else if (!em.streamEnabled) {
    findings.push({
      id: 'enhanced_measurement',
      category: 'Property Configuration',
      severity: 'warning',
      title: 'Enhanced Measurement Is Disabled',
      description: 'Automatic tracking for scroll depth (90%), outbound clicks, file downloads, and video engagement is turned off.',
      evidence: ['Enhanced Measurement Stream Switch: OFF'],
      fixSteps: ['Go to GA4 Admin → Data Streams → Click your Web Stream → Toggle Enhanced Measurement ON.'],
      penalty: 5
    });
  } else if (em.formInteractionsEnabled) {
    findings.push({
      id: 'enhanced_measurement',
      category: 'Property Configuration',
      severity: 'warning',
      title: 'Enhanced Measurement Auto Form Tracking Trap Enabled',
      description: '"Form interactions" is enabled inside Enhanced Measurement. This often fires false-positive `form_submit` events on search bars, newsletter inputs, hotel date pickers, and validation failures — inflating lead counts.',
      evidence: ['formInteractionsEnabled = true on Web Stream Enhanced Measurement'],
      fixSteps: [
        'Open GA4 Admin → Data Streams → Web Stream → Enhanced Measurement Settings (gear icon).',
        'Toggle OFF "Form interactions" if you track forms via GTM custom triggers (e.g. GTMObserver validated submission recipes).'
      ],
      penalty: 5
    });
  } else {
    findings.push({
      id: 'enhanced_measurement',
      category: 'Property Configuration',
      severity: 'passed',
      title: 'Enhanced Measurement Optimally Configured',
      description: 'Enhanced Measurement is active with noisy auto "Form interactions" cleanly disabled to preserve GTM lead accuracy.',
      evidence: ['Enhanced Measurement: ON', 'Auto Form Interactions: OFF'],
      fixSteps: [],
      penalty: 0
    });
  }

  // 11. Property Metadata (Timezone, Currency, Industry)
  const propTimeZone = snapshot.property.timeZone || 'Not Set';
  const propCurrency = snapshot.property.currencyCode || 'Not Set';
  const propIndustry = snapshot.property.industryCategory || 'INDUSTRY_CATEGORY_UNSPECIFIED';
  if (propIndustry === 'INDUSTRY_CATEGORY_UNSPECIFIED' || !snapshot.property.timeZone || !snapshot.property.currencyCode) {
    findings.push({
      id: 'property_metadata',
      category: 'Property Configuration',
      severity: 'info',
      title: 'Incomplete Property Business Metadata',
      description: 'Verify timezone, currency, and industry category in Property Details so daily anomaly cutoffs and benchmarks align with your business.',
      evidence: [
        `Timezone: ${propTimeZone}`,
        `Currency: ${propCurrency}`,
        `Industry: ${propIndustry.replace(/_/g, ' ')}`
      ],
      fixSteps: ['Open GA4 Admin → Property Settings → Property Details and set Industry Category, Reporting Timezone, and Currency.'],
      penalty: 0
    });
  } else {
    findings.push({
      id: 'property_metadata',
      category: 'Property Configuration',
      severity: 'passed',
      title: 'Property Details & Localization Configured',
      description: 'Reporting timezone, currency, and industry category are properly configured.',
      evidence: [`Timezone: ${propTimeZone}`, `Currency: ${propCurrency}`, `Industry: ${propIndustry.replace(/_/g, ' ')}`],
      fixSteps: [],
      penalty: 0
    });
  }

  // =========================================================================
  // CATEGORY 4: DATA QUALITY & PRIVACY
  // =========================================================================

  // 12. PII Exposure in Page URLs
  const emailRegex = /[a-zA-Z0-9._%+-]+(?:@|%40)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  const piiKeyRegex = /(?:^|[?&])(email|e-mail|phone|tel|mobile|first_name|last_name|full_name|password|passwd|ssn)=/i;
  const piiHits = pages.filter(p => emailRegex.test(p.pagePathPlusQueryString) || piiKeyRegex.test(p.pagePathPlusQueryString));

  if (piiHits.length > 0) {
    findings.push({
      id: 'pii_in_urls',
      category: 'Data Quality & Privacy',
      severity: 'critical',
      title: 'Personally Identifiable Information (PII) Detected in Page URLs',
      description: 'Email addresses or sensitive form query parameters are leaking into GA4 `page_location` URLs. This violates Google Analytics Terms of Service and GDPR/CCPA policies, risking account termination.',
      evidence: piiHits.slice(0, 6).map(
        p => `${sanitizeUrlForEvidence(p.pagePathPlusQueryString)} (${p.screenPageViews.toLocaleString()} views)`
      ),
      fixSteps: [
        'Immediately stop submitting forms via HTTP GET parameters containing email, phone, or name.',
        'Enable GA4 Admin → Data Streams → Redact Data → Redact Emails & Query Parameters.',
        'In GTM, strip sensitive query params via a custom JavaScript variable before passing `page_location` to GA4.'
      ],
      penalty: 20
    });
  } else {
    findings.push({
      id: 'pii_in_urls',
      category: 'Data Quality & Privacy',
      severity: 'passed',
      title: 'No PII Leaks Found in Top Page URLs',
      description: `Scanned ${pages.length} top page URLs and found zero plaintext email addresses or sensitive personal query keys.`,
      evidence: [],
      fixSteps: [],
      penalty: 0
    });
  }

  // 13. Unassigned Channel Attribution
  const totalSessionsSum = totals.sessions > 0
    ? totals.sessions
    : channels.reduce((acc, c) => acc + c.sessions, 0);
  const unassignedCh = channels.find(c => (c.channel || '').toLowerCase() === 'unassigned');
  const unassignedSessions = unassignedCh?.sessions || 0;
  const unassignedPct = totalSessionsSum > 0 ? (unassignedSessions / totalSessionsSum) * 100 : 0;

  if (unassignedPct >= 10) {
    findings.push({
      id: 'unassigned_traffic',
      category: 'Data Quality & Privacy',
      severity: 'critical',
      title: `Severe "Unassigned" Traffic Attribution (${unassignedPct.toFixed(1)}%)`,
      description: `${unassignedSessions.toLocaleString()} sessions (${unassignedPct.toFixed(1)}%) landed in GA4's "Unassigned" bucket over the last 30 days. Typically caused by non-standard UTM parameters, Measurement Protocol hits missing session_id, or events firing before page_view/session_start.`,
      evidence: [
        `Unassigned Sessions: ${unassignedSessions.toLocaleString()} of ${totalSessionsSum.toLocaleString()} (${unassignedPct.toFixed(1)}%)`,
        `Unassigned Key Events: ${(unassignedCh?.keyEvents || 0).toLocaleString()} • Revenue: $${(unassignedCh?.revenue || 0).toFixed(2)}`
      ],
      fixSteps: [
        'Standardize `utm_source` and `utm_medium` values against Google Default Channel Group definitions (e.g., use `cpc`/`paid_social`, never arbitrary mediums).',
        'Verify GTM tag firing sequencing so GA4 Google Tag initializes on Initialization / All Pages BEFORE custom event tags.'
      ],
      penalty: 12
    });
  } else if (unassignedPct >= 5) {
    findings.push({
      id: 'unassigned_traffic',
      category: 'Data Quality & Privacy',
      severity: 'warning',
      title: `Elevated "Unassigned" Traffic (${unassignedPct.toFixed(1)}%)`,
      description: `${unassignedPct.toFixed(1)}% of sessions are unattributed under "Unassigned", reducing campaign ROAS visibility.`,
      evidence: [`Unassigned Sessions: ${unassignedSessions.toLocaleString()} (${unassignedPct.toFixed(1)}%)`],
      fixSteps: [
        'Audit non-standard `utm_medium` / `utm_source` tags across email, social, and affiliate links.'
      ],
      penalty: 6
    });
  } else {
    findings.push({
      id: 'unassigned_traffic',
      category: 'Data Quality & Privacy',
      severity: 'passed',
      title: `Healthy Channel Attribution (${unassignedPct.toFixed(1)}% Unassigned)`,
      description: 'Unassigned traffic is safely below the 5% warning threshold.',
      evidence: totalSessionsSum > 0 ? [`Unassigned: ${unassignedSessions.toLocaleString()} sessions (${unassignedPct.toFixed(1)}%)`] : [],
      fixSteps: [],
      penalty: 0
    });
  }

  // 14. High Direct Traffic Ratio
  const directCh = channels.find(c => (c.channel || '').toLowerCase() === 'direct');
  const directSessions = directCh?.sessions || 0;
  const directPct = totalSessionsSum > 0 ? (directSessions / totalSessionsSum) * 100 : 0;

  if (totalSessionsSum > 100 && directPct >= 60) {
    findings.push({
      id: 'direct_traffic_high',
      category: 'Data Quality & Privacy',
      severity: 'warning',
      title: `Abnormally High Direct Traffic Share (${directPct.toFixed(1)}%)`,
      description: 'Over 60% of traffic is attributed as Direct, often masking untagged email/QR/PDF campaigns, HTTP-to-HTTPS redirect stripping, or missing cross-domain linkers.',
      evidence: [`Direct Sessions: ${directSessions.toLocaleString()} of ${totalSessionsSum.toLocaleString()} (${directPct.toFixed(1)}%)`],
      fixSteps: [
        'Enforce consistent UTM tagging on all email newsletters, SMS campaigns, and social bio links.',
        'Inspect server redirects (http -> https or trailing-slash rules) to verify `referrer` headers and UTM parameters are preserved.'
      ],
      penalty: 5
    });
  } else {
    findings.push({
      id: 'direct_traffic_high',
      category: 'Data Quality & Privacy',
      severity: 'passed',
      title: `Normal Direct Traffic Ratio (${directPct.toFixed(1)}%)`,
      description: 'Direct traffic share falls within healthy attribution norms.',
      evidence: totalSessionsSum > 0 ? [`Direct: ${directSessions.toLocaleString()} sessions (${directPct.toFixed(1)}%)`] : [],
      fixSteps: [],
      penalty: 0
    });
  }

  // 15. (not set) Landing Pages
  const notSetLandingSessions = landingPages
    .filter(lp => !lp.landingPage || lp.landingPage === '(not set)')
    .reduce((acc, lp) => acc + lp.sessions, 0);
  const notSetLandingPct = totalSessionsSum > 0 ? (notSetLandingSessions / totalSessionsSum) * 100 : 0;

  if (notSetLandingPct >= 10) {
    findings.push({
      id: 'not_set_landing_pages',
      category: 'Data Quality & Privacy',
      severity: 'critical',
      title: `High "(not set)" Landing Pages (${notSetLandingPct.toFixed(1)}%)`,
      description: 'More than 10% of sessions lack a landing page, indicating Measurement Protocol events without valid session stitching, idle sessions past midnight, or custom events firing without a `page_view` event.',
      evidence: [`(not set) landing sessions: ${notSetLandingSessions.toLocaleString()} (${notSetLandingPct.toFixed(1)}%)`],
      fixSteps: [
        'Ensure Google Tag (`page_view`) initializes immediately on page load before engagement, scroll, or conversion events fire.',
        'Include real `session_id` and `engagement_time_msec` in any backend Measurement Protocol hits.'
      ],
      penalty: 10
    });
  } else if (notSetLandingPct >= 5) {
    findings.push({
      id: 'not_set_landing_pages',
      category: 'Data Quality & Privacy',
      severity: 'warning',
      title: `Elevated "(not set)" Landing Pages (${notSetLandingPct.toFixed(1)}%)`,
      description: 'Between 5% and 10% of sessions recorded `(not set)` as the landing page.',
      evidence: [`(not set) landing sessions: ${notSetLandingSessions.toLocaleString()} (${notSetLandingPct.toFixed(1)}%)`],
      fixSteps: ['Audit GTM trigger timing so Config/Google Tag executes at Initialization rather than Window Loaded.'],
      penalty: 5
    });
  } else {
    findings.push({
      id: 'not_set_landing_pages',
      category: 'Data Quality & Privacy',
      severity: 'passed',
      title: `Clean Landing Page Attribution (${notSetLandingPct.toFixed(1)}% (not set))`,
      description: 'Session start and `page_view` events stitch cleanly to landing pages.',
      evidence: [],
      fixSteps: [],
      penalty: 0
    });
  }

  // 16. Suspected Duplicate GA4 Tracking
  const pagesPerSession = totals.sessions > 0 ? totals.screenPageViews / totals.sessions : 0;
  const bouncePct = totals.bounceRate * 100;
  if (
    totals.sessions >= 100 &&
    (totals.bounceRate < 0.05 || (pagesPerSession > 15 && totals.averageSessionDuration < 20))
  ) {
    findings.push({
      id: 'duplicate_tracking',
      category: 'Data Quality & Privacy',
      severity: 'critical',
      title: 'Suspected Duplicate GA4 Tag Installation',
      description: `Unusually low bounce rate (${bouncePct.toFixed(1)}%) or inflated pageviews/session (${pagesPerSession.toFixed(1)}) indicates GA4 is double-firing page_view events — usually because both GTM and a hardcoded gtag.js/WordPress plugin (MonsterInsights/SiteKit) are active simultaneously.`,
      evidence: [
        `30-day Bounce Rate: ${bouncePct.toFixed(1)}%`,
        `Pages / Session: ${pagesPerSession.toFixed(1)}`,
        `Avg Session Duration: ${Math.round(totals.averageSessionDuration)}s`
      ],
      fixSteps: [
        'Inspect page source and Tag Assistant for duplicate Measurement ID calls.',
        'Remove hardcoded `gtag.js` or CMS analytics plugins if deploying GA4 through Google Tag Manager.'
      ],
      penalty: 12
    });
  } else {
    findings.push({
      id: 'duplicate_tracking',
      category: 'Data Quality & Privacy',
      severity: 'passed',
      title: 'No Duplicate Tagging Symptoms Detected',
      description: 'Bounce rate and pageviews per session look consistent with single-tag execution.',
      evidence: totals.sessions > 0
        ? [`Bounce Rate: ${bouncePct.toFixed(1)}%`, `Pages/Session: ${pagesPerSession.toFixed(1)}`]
        : [],
      fixSteps: [],
      penalty: 0
    });
  }

  // 17. Query Parameter URL Fragmentation
  const FRAG_PARAMS = ['fbclid=', 'gclid=', 'msclkid=', 'mc_cid=', 'mc_eid=', '_gl=', 'sessionid=', 'jsessionid='];
  const fragmentedPages = pages.filter(p => {
    const lower = (p.pagePathPlusQueryString || '').toLowerCase();
    return FRAG_PARAMS.some(param => lower.includes(param));
  });
  if (fragmentedPages.length >= 3) {
    findings.push({
      id: 'query_param_fragmentation',
      category: 'Data Quality & Privacy',
      severity: 'warning',
      title: `URL Fragmentation via Tracking Query Parameters (${fragmentedPages.length} URLs)`,
      description: 'Click IDs (`fbclid`, `gclid`, `_gl`, etc.) are fragmenting identical page paths into dozens of separate rows in GA4 Page reports.',
      evidence: fragmentedPages.slice(0, 5).map(p => `${p.pagePathPlusQueryString} (${p.screenPageViews} views)`),
      fixSteps: [
        'Use GTM or GA4 page_location normalization templates to strip non-content tracking parameters after GA4 parses attribution (note: do not strip gclid before Google Tag reads it).'
      ],
      penalty: 4
    });
  } else {
    findings.push({
      id: 'query_param_fragmentation',
      category: 'Data Quality & Privacy',
      severity: 'passed',
      title: 'Minimal URL Query Parameter Fragmentation',
      description: 'Top page paths are cleanly consolidated without severe click-ID row splitting.',
      evidence: [],
      fixSteps: [],
      penalty: 0
    });
  }

  // =========================================================================
  // CATEGORY 5: CONVERSIONS & EVENTS
  // =========================================================================

  // 18. Live Telemetry Check
  if (totals.sessions === 0) {
    findings.push({
      id: 'telemetry_alive',
      category: 'Conversions & Events',
      severity: 'critical',
      title: 'Zero Traffic Recorded in the Last 30 Days',
      description: 'GA4 recorded 0 sessions over the past 30 days. Either your tracking snippet/GTM container is missing from production, paused, or sending hits to a different Measurement ID.',
      evidence: ['30-day Sessions: 0', '30-day Event Count: 0'],
      fixSteps: [
        'Verify your live website has the Google Tag Manager snippet or correct `G-` Measurement ID installed and published.',
        'Test with GA4 Admin → DebugView to confirm incoming hits.'
      ],
      penalty: 25
    });
  } else {
    findings.push({
      id: 'telemetry_alive',
      category: 'Conversions & Events',
      severity: 'passed',
      title: 'Live GA4 Telemetry Active',
      description: `Property actively ingested ${totals.sessions.toLocaleString()} sessions and ${totals.eventCount.toLocaleString()} events over the last 30 days.`,
      evidence: [`Sessions: ${totals.sessions.toLocaleString()}`, `Active Users: ${totals.activeUsers.toLocaleString()}`],
      fixSteps: [],
      penalty: 0
    });
  }

  // 19. Key Events Configuration & Firing Audit
  const eventCountMap = new Map<string, { eventCount: number; totalUsers: number }>();
  for (const ev of events) {
    eventCountMap.set(ev.eventName, { eventCount: ev.eventCount, totalUsers: ev.totalUsers });
  }

  const configuredKeyEvents = snapshot.keyEvents;
  const keyEventsStatus: Ga4AuditReport['forensics']['keyEventsStatus'] = (configuredKeyEvents || []).map(ke => {
    const count30d = eventCountMap.get(ke.eventName)?.eventCount || 0;
    const isNoisy = NOISY_KEY_EVENTS.has(ke.eventName);
    const status: 'firing' | 'inactive' | 'noisy' = isNoisy
      ? 'noisy'
      : count30d > 0
        ? 'firing'
        : 'inactive';
    return {
      eventName: ke.eventName,
      countingMethod: ke.countingMethod || 'ONCE_PER_EVENT',
      count30d,
      status
    };
  });

  if (configuredKeyEvents === null) {
    findings.push({
      id: 'key_events_health',
      category: 'Conversions & Events',
      severity: 'info',
      title: 'Key Events Configuration Unavailable',
      description: 'Configured Key Events list could not be retrieved from Admin API.',
      evidence: [],
      fixSteps: ['Inspect under GA4 Admin → Data Display → Key Events.'],
      penalty: 0
    });
  } else if (configuredKeyEvents.length === 0) {
    findings.push({
      id: 'key_events_health',
      category: 'Conversions & Events',
      severity: 'critical',
      title: 'Zero Key Events (Conversions) Configured',
      description: 'No business outcomes (bookings, purchases, form submissions, phone clicks) are marked as Key Events. Marketing ROI and ad bidding cannot optimize.',
      evidence: ['Configured Key Events: 0'],
      fixSteps: [
        'Deploy conversion events (`generate_lead`, `purchase`, `form_submission`, `phone_click`) via GTMObserver Dashboard.',
        'Open GA4 Admin → Data Display → Key Events and mark true business outcomes as Key Events.'
      ],
      penalty: 15
    });
  } else {
    const noisyKEs = keyEventsStatus.filter(k => k.status === 'noisy');
    const inactiveKEs = keyEventsStatus.filter(k => k.status === 'inactive');

    if (noisyKEs.length > 0) {
      findings.push({
        id: 'key_events_health',
        category: 'Conversions & Events',
        severity: 'critical',
        title: `Noisy Auto-Events Marked as Key Events (${noisyKEs.length} Found)`,
        description: 'Non-conversion engagement events (`page_view`, `scroll`, `session_start`, etc.) are flagged as Key Events, artificially inflating conversion rates near 100% and corrupting Google Ads bidding.',
        evidence: [
          ...noisyKEs.map(k => `Noisy Key Event: ${k.eventName} (${k.count30d.toLocaleString()} events/30d)`),
          ...inactiveKEs.map(k => `Inactive Key Event (0 fires/30d): ${k.eventName}`)
        ],
        fixSteps: [
          'Open GA4 Admin → Data Display → Key Events and immediately unmark `page_view`, `session_start`, `scroll`, `first_visit`, and `user_engagement`.',
          inactiveKEs.length > 0
            ? `Also verify triggers for inactive Key Events: ${inactiveKEs.map(k => k.eventName).join(', ')}.`
            : 'Keep only genuine conversion actions (purchases, bookings, qualified leads) marked as Key Events.'
        ],
        penalty: 10
      });
    } else if (inactiveKEs.length > 0 && totals.sessions > 0) {
      findings.push({
        id: 'key_events_health',
        category: 'Conversions & Events',
        severity: 'warning',
        title: `${inactiveKEs.length} Configured Key Event(s) Recorded 0 Hits in 30 Days`,
        description: 'One or more configured Key Events have not fired at all over the last 30 days, indicating a broken GTM trigger, renamed form event, or obsolete configuration.',
        evidence: inactiveKEs.map(k => `Inactive Key Event (0 count in top 30d events): ${k.eventName}`),
        fixSteps: [
          'Test the affected conversion flow in GTM Preview / GA4 DebugView to check if the trigger condition changed.',
          'Archive obsolete Key Events under GA4 Admin → Data Display → Key Events.'
        ],
        penalty: 6
      });
    } else {
      findings.push({
        id: 'key_events_health',
        category: 'Conversions & Events',
        severity: 'passed',
        title: `All ${configuredKeyEvents.length} Key Event(s) Healthy & Firing`,
        description: 'Key Events represent genuine conversion actions and are actively firing with zero noisy auto-events.',
        evidence: keyEventsStatus.slice(0, 6).map(k => `${k.eventName} (${k.count30d.toLocaleString()} in 30d)`),
        fixSteps: [],
        penalty: 0
      });
    }
  }

  // 20. Ecommerce / Booking Revenue Integrity
  const purchaseEventCount = eventCountMap.get('purchase')?.eventCount || 0;
  if ((purchaseEventCount > 0 || totals.transactions > 0) && totals.totalRevenue === 0) {
    findings.push({
      id: 'revenue_integrity',
      category: 'Conversions & Events',
      severity: 'critical',
      title: 'Transactions Recorded With $0.00 Revenue',
      description: `Detected ${Math.max(purchaseEventCount, totals.transactions).toLocaleString()} purchase/booking events, but Total Revenue is $0.00. The \`purchase\` tag is missing \`value\` or \`currency\` parameters (or currency code is invalid).`,
      evidence: [
        `purchase event count: ${purchaseEventCount.toLocaleString()}`,
        `Transactions: ${totals.transactions.toLocaleString()}`,
        'Total Revenue: $0.00'
      ],
      fixSteps: [
        'Inspect your GTM `purchase` / booking confirmation event dataLayer object to verify numeric `value` and ISO 4217 `currency` (e.g. `USD`) are populated cleanly without `$` symbols or commas.'
      ],
      penalty: 12
    });
  } else if (totals.transactions > 0 && totals.totalRevenue > 0) {
    findings.push({
      id: 'revenue_integrity',
      category: 'Conversions & Events',
      severity: 'passed',
      title: 'Ecommerce & Booking Revenue Tracking Intact',
      description: `Tracked ${totals.transactions.toLocaleString()} transactions generating $${totals.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in revenue.`,
      evidence: [],
      fixSteps: [],
      penalty: 0
    });
  } else {
    findings.push({
      id: 'revenue_integrity',
      category: 'Conversions & Events',
      severity: 'info',
      title: 'No Ecommerce / Revenue Transactions Recorded',
      description: 'No `purchase` events or revenue recorded in the last 30 days (normal for B2B lead-gen/editorial sites; critical if this is a hotel booking engine or online store).',
      evidence: [],
      fixSteps: ['If you accept online bookings or checkouts, deploy an Enhanced Ecommerce `purchase` tracking recipe via GTMObserver Dashboard.'],
      penalty: 0
    });
  }

  // 21. Event Naming Hygiene
  const topEvents = events.map(ev => {
    const isStd = STANDARD_GA4_EVENTS.has(ev.eventName);
    const badChars = /[A-Z\s-]/.test(ev.eventName) || ev.eventName.length > 40;
    const namingOk = isStd || !badChars;
    return {
      ...ev,
      namingOk,
      isStandard: isStd
    };
  });
  const messyEvents = topEvents.filter(e => !e.namingOk);
  if (messyEvents.length > 0) {
    findings.push({
      id: 'event_naming_hygiene',
      category: 'Conversions & Events',
      severity: 'warning',
      title: `Non-Standard Event Naming Found (${messyEvents.length} Event${messyEvents.length > 1 ? 's' : ''})`,
      description: 'Events contain uppercase letters, spaces, hyphens, or exceed GA4’s 40-character limit. Because GA4 event names are case-sensitive, inconsistent naming splits reports and breaks BigQuery schemas.',
      evidence: messyEvents.slice(0, 8).map(e => `"${e.eventName}" (${e.eventCount.toLocaleString()} events)`),
      fixSteps: [
        'Adopt strict lowercase `snake_case` naming across all GTM GA4 Event tags (e.g. `form_submission` instead of `Form Submit` or `cta-click`).',
        'Use GA4 Admin → Events → Modify Event to normalize historical mismatches if needed.'
      ],
      penalty: 4
    });
  } else {
    findings.push({
      id: 'event_naming_hygiene',
      category: 'Conversions & Events',
      severity: 'passed',
      title: 'Clean GA4 `snake_case` Event Naming Convention',
      description: 'All detected events follow lowercase `snake_case` naming rules within GA4 length limits.',
      evidence: [],
      fixSteps: [],
      penalty: 0
    });
  }

  // 22. Custom Dimensions Quota
  const customDims = snapshot.customDimensions;
  const customMetricsCount = snapshot.customMetrics?.length || 0;
  const eventCustomDimUsed = (customDims || []).filter(d => d.scope === 'EVENT').length;
  const userCustomDimUsed = (customDims || []).filter(d => d.scope === 'USER').length;

  if (customDims === null) {
    findings.push({
      id: 'custom_dimensions',
      category: 'Conversions & Events',
      severity: 'info',
      title: 'Custom Dimensions Quota Unavailable',
      description: 'Custom dimensions list could not be retrieved from Admin API.',
      evidence: [],
      fixSteps: [],
      penalty: 0
    });
  } else if (eventCustomDimUsed >= 43 || userCustomDimUsed >= 22) {
    findings.push({
      id: 'custom_dimensions',
      category: 'Conversions & Events',
      severity: 'warning',
      title: 'Approaching Standard GA4 Custom Dimension Quota',
      description: `Standard GA4 limits properties to 50 Event-scoped and 25 User-scoped custom dimensions. Current usage is nearing saturation.`,
      evidence: [
        `Event-scoped Custom Dimensions: ${eventCustomDimUsed} / 50`,
        `User-scoped Custom Dimensions: ${userCustomDimUsed} / 25`
      ],
      fixSteps: ['Audit and archive unused custom dimensions under GA4 Admin → Data Display → Custom Definitions before registering new parameters.'],
      penalty: 4
    });
  } else if (customDims.length === 0) {
    findings.push({
      id: 'custom_dimensions',
      category: 'Conversions & Events',
      severity: 'info',
      title: 'No Custom Dimensions Registered',
      description: 'Custom GTM parameters (like `form_name`, `hotel_property`, `user_tier`, or `cta_location`) will not appear in GA4 reports unless registered as Custom Dimensions.',
      evidence: ['Event-scoped: 0 / 50', 'User-scoped: 0 / 25'],
      fixSteps: ['Register key event parameters under GA4 Admin → Data Display → Custom Definitions → Create custom dimension.'],
      penalty: 0
    });
  } else {
    findings.push({
      id: 'custom_dimensions',
      category: 'Conversions & Events',
      severity: 'passed',
      title: 'Custom Dimensions Quota Healthy',
      description: 'Custom dimension utilization is safely within GA4 property limits.',
      evidence: [
        `Event-scoped: ${eventCustomDimUsed} / 50`,
        `User-scoped: ${userCustomDimUsed} / 25`,
        `Custom Metrics: ${customMetricsCount} / 50`
      ],
      fixSteps: [],
      penalty: 0
    });
  }

  // =========================================================================
  // SCORE & SUMMARY AGGREGATION
  // =========================================================================
  const totalPenalty = findings.reduce((sum, f) => sum + (f.penalty || 0), 0);
  const healthScore = Math.max(0, Math.min(100, 100 - totalPenalty));
  const grade: Ga4AuditReport['grade'] =
    healthScore >= 90
      ? 'Excellent'
      : healthScore >= 75
        ? 'Good'
        : healthScore >= 50
          ? 'Needs Attention'
          : 'Critical';

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const warningCount = findings.filter(f => f.severity === 'warning').length;
  const infoCount = findings.filter(f => f.severity === 'info').length;
  const passedCount = findings.filter(f => f.severity === 'passed').length;

  const formattedChannels = channels.map(ch => {
    const sharePct = totalSessionsSum > 0 ? (ch.sessions / totalSessionsSum) * 100 : 0;
    const lower = (ch.channel || '').toLowerCase();
    let flag: 'unassigned' | 'high_direct' | 'normal' = 'normal';
    if (lower === 'unassigned' && sharePct >= 5) flag = 'unassigned';
    else if (lower === 'direct' && totalSessionsSum > 100 && sharePct >= 60) flag = 'high_direct';
    return {
      ...ch,
      sharePct: Number(sharePct.toFixed(1)),
      flag
    };
  });

  // Sort findings: critical -> warning -> info -> passed
  const sevOrder: Record<AuditSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    passed: 3
  };
  findings.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

  return {
    generatedAt: new Date().toISOString(),
    healthScore,
    grade,
    summary: {
      criticalCount,
      warningCount,
      infoCount,
      passedCount,
      totalChecks: findings.length
    },
    propertyMeta: {
      propertyId: snapshot.property.name,
      displayName: snapshot.property.displayName,
      measurementId: primaryStream?.measurementId || 'Not Set',
      defaultUri: defaultUri || 'Not Set',
      rootDomain: rootDomain || 'Unknown',
      timeZone: snapshot.property.timeZone || 'Not Set',
      currencyCode: snapshot.property.currencyCode || 'Not Set',
      industryCategory: (snapshot.property.industryCategory || 'UNSPECIFIED').replace(/_/g, ' '),
      dataRetention: formatRetentionLabel(retention?.eventDataRetention),
      resetUserDataOnNewActivity: retention?.resetUserDataOnNewActivity ?? null,
      attributionModel: (snapshot.attribution?.reportingAttributionModel || 'DATA_DRIVEN').replace(/_/g, ' '),
      eventCustomDimUsed,
      userCustomDimUsed,
      customMetricsCount,
      totals30d: totals
    },
    integrations,
    findings,
    forensics: {
      referrals: classifiedReferrals,
      hostnames: classifiedHostnames,
      channels: formattedChannels,
      keyEventsStatus,
      topEvents,
      streams: snapshot.dataStreams || []
    },
    apiAccessNotes: snapshot.apiAccessNotes || []
  };
}

export function buildDemoGa4Snapshot(): Ga4AuditRawSnapshot {
  return {
    property: {
      name: 'properties/999888777',
      displayName: 'Grand Horizon Resort & Spa — GA4 (Demo Audit)',
      timeZone: 'America/New_York',
      currencyCode: 'USD',
      industryCategory: 'TRAVEL',
      createTime: '2024-03-15T10:00:00Z'
    },
    dataStreams: [
      {
        name: 'properties/999888777/dataStreams/1122334455',
        displayName: 'Grand Horizon Web Stream',
        type: 'WEB_DATA_STREAM',
        measurementId: 'G-DEMO778899',
        defaultUri: 'https://www.grandhorizonresort.com'
      }
    ],
    dataRetention: {
      eventDataRetention: 'TWO_MONTHS',
      resetUserDataOnNewActivity: true
    },
    enhancedMeasurement: {
      streamEnabled: true,
      scrollsEnabled: true,
      outboundClicksEnabled: true,
      siteSearchEnabled: true,
      videoEngagementEnabled: true,
      fileDownloadsEnabled: true,
      pageChangesEnabled: true,
      formInteractionsEnabled: true
    },
    googleSignals: {
      state: 'GOOGLE_SIGNALS_DISABLED',
      consent: 'CONSENT_MODE_UNSPECIFIED'
    },
    attribution: {
      acquisitionConversionEventLookbackWindow: 'ACQUISITION_CONVERSION_EVENT_LOOKBACK_WINDOW_30_DAYS',
      otherConversionEventLookbackWindow: 'OTHER_CONVERSION_EVENT_LOOKBACK_WINDOW_90_DAYS',
      reportingAttributionModel: 'PAID_AND_ORGANIC_CHANNELS_DATA_DRIVEN'
    },
    links: {
      googleAds: [],
      searchConsole: [],
      bigQuery: [],
      dv360: [],
      sa360: [],
      adSense: [],
      measurementProtocolSecretsCount: 0
    },
    keyEvents: [
      { eventName: 'purchase', countingMethod: 'ONCE_PER_EVENT' },
      { eventName: 'generate_lead', countingMethod: 'ONCE_PER_SESSION' },
      { eventName: 'wedding_rfp_submit', countingMethod: 'ONCE_PER_SESSION' }
    ],
    customDimensions: [
      { parameterName: 'room_type', displayName: 'Room Category', scope: 'EVENT' },
      { parameterName: 'rate_plan', displayName: 'Booking Rate Plan', scope: 'EVENT' },
      { parameterName: 'loyalty_tier', displayName: 'Guest Loyalty Tier', scope: 'USER' }
    ],
    customMetrics: [
      { parameterName: 'nights_booked', displayName: 'Nights Booked' }
    ],
    telemetry30d: {
      totals: {
        sessions: 48200,
        activeUsers: 36910,
        totalUsers: 38120,
        eventCount: 284500,
        screenPageViews: 142300,
        keyEvents: 612,
        transactions: 194,
        totalRevenue: 94850.0,
        bounceRate: 0.42,
        engagementRate: 0.58,
        averageSessionDuration: 164
      },
      channels: [
        { channel: 'Organic Search', sessions: 19400, keyEvents: 295, revenue: 46120.0 },
        { channel: 'Paid Search', sessions: 10850, keyEvents: 162, revenue: 28400.0 },
        { channel: 'Direct', sessions: 7450, keyEvents: 48, revenue: 7210.0 },
        { channel: 'Unassigned', sessions: 5495, keyEvents: 22, revenue: 1120.0 },
        { channel: 'Referral', sessions: 3420, keyEvents: 78, revenue: 11420.0 },
        { channel: 'Email', sessions: 1585, keyEvents: 7, revenue: 580.0 }
      ],
      referrals: [
        { source: 'be.synxis.com', medium: 'referral', sessions: 1480, keyEvents: 64, transactions: 58, revenue: 26850.0 },
        { source: 'paypal.com', medium: 'referral', sessions: 410, keyEvents: 19, transactions: 19, revenue: 8940.0 },
        { source: 'grandhorizonresort.com', medium: 'referral', sessions: 325, keyEvents: 12, transactions: 9, revenue: 4120.0 },
        { source: 'tripadvisor.com', medium: 'referral', sessions: 890, keyEvents: 11, transactions: 7, revenue: 3150.0 },
        { source: 'visitflorida.com', medium: 'referral', sessions: 315, keyEvents: 3, transactions: 1, revenue: 420.0 }
      ],
      hostnames: [
        { hostName: 'www.grandhorizonresort.com', sessions: 42150, screenPageViews: 121500 },
        { hostName: 'be.synxis.com', sessions: 5890, screenPageViews: 19980 },
        { hostName: 'staging.grandhorizonresort.com', sessions: 160, screenPageViews: 820 }
      ],
      events: [
        { eventName: 'page_view', eventCount: 142300, totalUsers: 38100 },
        { eventName: 'session_start', eventCount: 48200, totalUsers: 38100 },
        { eventName: 'user_engagement', eventCount: 41200, totalUsers: 31000 },
        { eventName: 'scroll', eventCount: 28400, totalUsers: 22100 },
        { eventName: 'begin_checkout', eventCount: 1120, totalUsers: 840 },
        { eventName: 'generate_lead', eventCount: 418, totalUsers: 390 },
        { eventName: 'purchase', eventCount: 194, totalUsers: 185 },
        { eventName: 'Newsletter Signup Button', eventCount: 285, totalUsers: 270 }
      ],
      pages: [
        { pagePathPlusQueryString: '/', screenPageViews: 39200 },
        { pagePathPlusQueryString: '/rooms-and-suites', screenPageViews: 28400 },
        { pagePathPlusQueryString: '/special-offers', screenPageViews: 16800 },
        { pagePathPlusQueryString: '/confirmation?booking_id=9821&email=guest.traveler@gmail.com', screenPageViews: 194 },
        { pagePathPlusQueryString: '/?fbclid=IwAR3demoTrackingParam01', screenPageViews: 1240 },
        { pagePathPlusQueryString: '/rooms-and-suites?gclid=CjwKCAiAdemo02', screenPageViews: 860 },
        { pagePathPlusQueryString: '/dining?_gl=1*demoLinkerParam03', screenPageViews: 410 }
      ],
      landingPages: [
        { landingPage: '/', sessions: 21400 },
        { landingPage: '/rooms-and-suites', sessions: 12900 },
        { landingPage: '/special-offers', sessions: 10980 },
        { landingPage: '(not set)', sessions: 2920 }
      ]
    },
    apiAccessNotes: ['Simulated local demonstration snapshot exercising all 22 automated GA4 audit rules.']
  };
}
