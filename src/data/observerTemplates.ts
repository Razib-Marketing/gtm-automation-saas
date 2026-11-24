export type ConditionOperator =
  | 'drops_below'
  | 'spikes_above'
  | 'changes_by'
  | 'equals_zero'
  | 'falls_under_value'
  | 'exceeds_value';

export type DeviceCategory = 'all' | 'desktop' | 'mobile' | 'tablet';

export interface TemplateCondition {
  metric: string;
  source: string;
  medium: string;
  device: DeviceCategory;
  conditionType: ConditionOperator;
  thresholdPercentage: number;
}

export interface IncidentTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
  websiteType: string;
  description: string;
  matchType: 'ALL' | 'ANY';
  period: string;
  conditions: TemplateCondition[];
}

export interface TimezoneOption {
  value: string;
  label: string;
}

export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
  { value: 'America/Denver', label: 'America/Denver (Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)' },
  { value: 'America/Toronto', label: 'America/Toronto (Eastern Canada)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (Brazil)' },
  { value: 'Europe/London', label: 'Europe/London (UK / GMT / BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (Central Europe)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (Central Europe)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UAE / Gulf UTC+4)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India UTC+5:30)' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (Bangladesh UTC+6)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan JST UTC+9)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (New Zealand)' }
];

export function getBrowserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && tz.trim() ? tz.trim() : 'UTC';
  } catch (_) {
    return 'UTC';
  }
}

export function getTimezoneOptions(extraTz?: string): TimezoneOption[] {
  const seen = new Set(TIMEZONE_OPTIONS.map(t => t.value));
  const list = [...TIMEZONE_OPTIONS];
  const browserTz = getBrowserTimezone();
  if (browserTz && !seen.has(browserTz)) {
    list.unshift({ value: browserTz, label: `${browserTz} (Detected Local)` });
    seen.add(browserTz);
  }
  if (extraTz && !seen.has(extraTz)) {
    list.unshift({ value: extraTz, label: extraTz });
  }
  return list;
}

export interface ComparisonPeriodOption {
  group: 'Daily & Short-Term' | 'Week over Week (WoW)' | 'Month over Month (MoM)' | 'Year over Year (YoY)';
  value: string;
  label: string;
  shortLabel: string;
}

export const COMPARISON_PERIODS: ComparisonPeriodOption[] = [
  {
    group: 'Daily & Short-Term',
    value: 'yesterday_vs_last_week',
    label: 'Yesterday vs Same Day Last Week (Recommended)',
    shortLabel: 'Yesterday vs Last Week'
  },
  {
    group: 'Daily & Short-Term',
    value: 'daily',
    label: 'Day over Day (Yesterday vs 2 Days Ago)',
    shortLabel: 'Day over Day'
  },
  {
    group: 'Week over Week (WoW)',
    value: 'week_over_week',
    label: 'Week over Week (Last 7 Days vs Previous 7 Days)',
    shortLabel: 'WoW (7d Rolling)'
  },
  {
    group: 'Week over Week (WoW)',
    value: 'wow_calendar',
    label: 'Week over Week (Last Complete Week Mon–Sun vs Prior Week)',
    shortLabel: 'WoW (Calendar)'
  },
  {
    group: 'Month over Month (MoM)',
    value: 'month_over_month',
    label: 'Month over Month (Last Complete Calendar Month vs Prior Month)',
    shortLabel: 'MoM (Calendar)'
  },
  {
    group: 'Month over Month (MoM)',
    value: 'last_30_vs_previous_30',
    label: 'Month over Month (Rolling 30 Days vs Previous 30 Days)',
    shortLabel: 'MoM (30d Rolling)'
  },
  {
    group: 'Month over Month (MoM)',
    value: 'last_28_vs_previous_28',
    label: '4-Week Cycle (Last 28 Days vs Previous 28 Days)',
    shortLabel: '28d Cycle'
  },
  {
    group: 'Year over Year (YoY)',
    value: 'year_over_year',
    label: 'Year over Year (Last 7 Days vs Same 7 Days Last Year)',
    shortLabel: 'YoY (7d)'
  },
  {
    group: 'Year over Year (YoY)',
    value: 'yoy_30_days',
    label: 'Year over Year (Last 30 Days vs Same 30 Days Last Year)',
    shortLabel: 'YoY (30d)'
  },
  {
    group: 'Year over Year (YoY)',
    value: 'yoy_month',
    label: 'Year over Year (Last Complete Month vs Same Month Last Year)',
    shortLabel: 'YoY (Calendar Month)'
  },
  {
    group: 'Year over Year (YoY)',
    value: 'yearly',
    label: 'Year over Year (Yesterday vs Same Date Last Year)',
    shortLabel: 'YoY (Single Day)'
  }
];

export function formatPeriodLabel(value?: string): string {
  if (!value) return 'Yesterday vs Last Week';
  const match = COMPARISON_PERIODS.find(p => p.value === value);
  if (match) return match.shortLabel;
  if (value === 'last_7_vs_previous_7') return 'WoW (7d Rolling)';
  if (value === 'weekly') return 'Yesterday vs Last Week';
  if (value === 'monthly') return 'MoM (30d Rolling)';
  return value.replace(/_/g, ' ');
}

export interface MetricOption {
  group: 'Traffic & Engagement' | 'Conversions & Revenue' | 'Content & Events';
  value: string;
  label: string;
  unit: 'count' | 'percent' | 'currency' | 'seconds';
}

export const GA4_METRICS: MetricOption[] = [
  { group: 'Traffic & Engagement', value: 'sessions', label: 'Sessions', unit: 'count' },
  { group: 'Traffic & Engagement', value: 'activeUsers', label: 'Active Users', unit: 'count' },
  { group: 'Traffic & Engagement', value: 'totalUsers', label: 'Total Users', unit: 'count' },
  { group: 'Traffic & Engagement', value: 'newUsers', label: 'New Users', unit: 'count' },
  { group: 'Traffic & Engagement', value: 'engagementRate', label: 'Engagement Rate (%)', unit: 'percent' },
  { group: 'Traffic & Engagement', value: 'bounceRate', label: 'Bounce Rate (%)', unit: 'percent' },
  { group: 'Traffic & Engagement', value: 'averageSessionDuration', label: 'Avg. Session Duration (s)', unit: 'seconds' },
  { group: 'Conversions & Revenue', value: 'keyEvents', label: 'Key Events (Conversions)', unit: 'count' },
  { group: 'Conversions & Revenue', value: 'transactions', label: 'Transactions (Bookings / Orders)', unit: 'count' },
  { group: 'Conversions & Revenue', value: 'totalRevenue', label: 'Total Revenue ($)', unit: 'currency' },
  { group: 'Conversions & Revenue', value: 'ecommercePurchases', label: 'Ecommerce Purchases', unit: 'count' },
  { group: 'Conversions & Revenue', value: 'sessionKeyEventRate', label: 'Session Key Event Rate (%)', unit: 'percent' },
  { group: 'Content & Events', value: 'screenPageViews', label: 'Pageviews (Screen Page Views)', unit: 'count' },
  { group: 'Content & Events', value: 'eventCount', label: 'Event Count', unit: 'count' }
];

export function getMetricUnit(metric: string): 'count' | 'percent' | 'currency' | 'seconds' {
  const m = GA4_METRICS.find(item => item.value === metric);
  return m ? m.unit : 'count';
}

export function getThresholdUnitSuffix(conditionType: string, metric: string): string {
  if (conditionType === 'equals_zero') return '';
  if (conditionType === 'falls_under_value' || conditionType === 'exceeds_value') {
    const unit = getMetricUnit(metric);
    if (unit === 'percent') return '%';
    if (unit === 'currency') return 'USD';
    if (unit === 'seconds') return 'sec';
    return '#';
  }
  return '%';
}

export function formatConditionRuleBadge(c: {
  conditionType?: string;
  condition_type?: string;
  thresholdPercentage?: number;
  threshold_percentage?: number;
  metric?: string;
}): string {
  const op = c.conditionType || c.condition_type || 'drops_below';
  const val = Number(c.thresholdPercentage ?? c.threshold_percentage ?? 0);
  const absVal = Math.abs(Number.isFinite(val) ? val : 0);
  const unit = getMetricUnit(c.metric || '');

  switch (op) {
    case 'spikes_above':
      return `Spikes > +${absVal}%`;
    case 'changes_by':
      return `Changes ±${absVal}%`;
    case 'equals_zero':
      return '= 0 (Outage)';
    case 'falls_under_value':
      if (unit === 'currency') return `< $${val.toLocaleString()}`;
      if (unit === 'percent') return `< ${val}%`;
      if (unit === 'seconds') return `< ${val}s`;
      return `< ${val.toLocaleString()}`;
    case 'exceeds_value':
      if (unit === 'currency') return `> $${val.toLocaleString()}`;
      if (unit === 'percent') return `> ${val}%`;
      if (unit === 'seconds') return `> ${val}s`;
      return `> ${val.toLocaleString()}`;
    case 'drops_below':
    default:
      return `Drops < -${absVal}%`;
  }
}

export const TEMPLATE_CATEGORIES = [
  { id: 'All', label: 'All Templates', icon: '✨' },
  { id: 'Hospitality & Hotels', label: 'Hospitality & Hotels', icon: '🏨' },
  { id: 'E-Commerce & Retail', label: 'E-Commerce & Retail', icon: '🛒' },
  { id: 'Lead Generation & B2B', label: 'Lead Generation & B2B', icon: '🎯' },
  { id: 'SEO & Content / Media', label: 'SEO & Content / Media', icon: '📈' },
  { id: 'Paid Acquisition (PPC)', label: 'Paid Acquisition (PPC)', icon: '💸' },
  { id: 'Site Health, UX & Security', label: 'Site Health, UX & Security', icon: '🛡️' }
];

export const INCIDENT_TEMPLATES: IncidentTemplate[] = [
  // ======================== HOSPITALITY & HOTELS (6) ========================
  {
    id: 'hospitality_booking_outage',
    name: 'Direct Booking Engine Outage',
    icon: '🏨',
    category: 'Hospitality & Hotels',
    websiteType: 'hospitality',
    description: 'Immediate alert when reservation transactions hit zero or bookings & room revenue crash across SynXis, Mews, iHotelier, or Windsurfer.',
    matchType: 'ANY',
    period: 'yesterday_vs_last_week',
    conditions: [
      { metric: 'transactions', source: 'all', medium: '', device: 'all', conditionType: 'equals_zero', thresholdPercentage: 0 },
      { metric: 'ecommercePurchases', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 40 },
      { metric: 'totalRevenue', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 40 }
    ]
  },
  {
    id: 'hospitality_cross_domain_leak',
    name: 'Direct vs. OTA / Referral Attribution Leak',
    icon: '🔗',
    category: 'Hospitality & Hotels',
    websiteType: 'hospitality',
    description: 'Detects broken cross-domain tracking between hotel site and booking engine when Referral transactions spike while Organic Search revenue drops.',
    matchType: 'ALL',
    period: 'week_over_week',
    conditions: [
      { metric: 'transactions', source: 'Referral', medium: '', device: 'all', conditionType: 'spikes_above', thresholdPercentage: 40 },
      { metric: 'totalRevenue', source: 'Organic Search', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 25 }
    ]
  },
  {
    id: 'hospitality_yoy_pace',
    name: 'Hotel Direct Revenue YoY Pace Drop',
    icon: '🛏️',
    category: 'Hospitality & Hotels',
    websiteType: 'hospitality',
    description: 'Seasonal Year-over-Year monitor comparing trailing 30-day direct room revenue and bookings against the exact same window last year.',
    matchType: 'ANY',
    period: 'yoy_30_days',
    conditions: [
      { metric: 'totalRevenue', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 15 },
      { metric: 'transactions', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 15 }
    ]
  },
  {
    id: 'hospitality_metasearch_cpc',
    name: 'Hotel Metasearch & Brand Paid Search Drop',
    icon: '🧭',
    category: 'Hospitality & Hotels',
    websiteType: 'hospitality',
    description: 'Alert when Paid Search (Google Hotel Ads / Brand CPC) sessions or booking conversions fall week-over-week while campaigns remain live.',
    matchType: 'ANY',
    period: 'week_over_week',
    conditions: [
      { metric: 'sessions', source: 'Paid Search', medium: 'cpc', device: 'all', conditionType: 'drops_below', thresholdPercentage: 25 },
      { metric: 'keyEvents', source: 'Paid Search', medium: 'cpc', device: 'all', conditionType: 'drops_below', thresholdPercentage: 25 }
    ]
  },
  {
    id: 'hospitality_rfp_leads',
    name: 'Group Bookings, Events & Wedding RFP Drop',
    icon: '🥂',
    category: 'Hospitality & Hotels',
    websiteType: 'hospitality',
    description: 'Monitors monthly group/banquet inquiry key events and conversion rate drops across hotel corporate and wedding RFP landing pages.',
    matchType: 'ANY',
    period: 'month_over_month',
    conditions: [
      { metric: 'keyEvents', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 25 },
      { metric: 'sessionKeyEventRate', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 20 }
    ]
  },
  {
    id: 'hospitality_mobile_friction',
    name: 'Mobile Guest Booking Flow Friction',
    icon: '📲',
    category: 'Hospitality & Hotels',
    websiteType: 'hospitality',
    description: 'Catches responsive rate-calendar issues or broken mobile booking widgets when mobile bounce rate surges alongside falling mobile conversion rate.',
    matchType: 'ALL',
    period: 'week_over_week',
    conditions: [
      { metric: 'bounceRate', source: 'all', medium: '', device: 'mobile', conditionType: 'spikes_above', thresholdPercentage: 25 },
      { metric: 'sessionKeyEventRate', source: 'all', medium: '', device: 'mobile', conditionType: 'drops_below', thresholdPercentage: 25 }
    ]
  },

  // ======================== E-COMMERCE & RETAIL (3) ========================
  {
    id: 'ecommerce_crash',
    name: 'E-Commerce Checkout & Revenue Crash',
    icon: '🛒',
    category: 'E-Commerce & Retail',
    websiteType: 'ecommerce',
    description: 'Instant alert if orders hit zero or checkout purchases and revenue drop sharply while store traffic continues.',
    matchType: 'ANY',
    period: 'yesterday_vs_last_week',
    conditions: [
      { metric: 'transactions', source: 'all', medium: '', device: 'all', conditionType: 'equals_zero', thresholdPercentage: 0 },
      { metric: 'ecommercePurchases', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 35 },
      { metric: 'totalRevenue', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 35 }
    ]
  },
  {
    id: 'ecommerce_mom_trend',
    name: 'Monthly Store GMV & Order Pace (MoM)',
    icon: '📦',
    category: 'E-Commerce & Retail',
    websiteType: 'ecommerce',
    description: 'Month-over-Month revenue and order tracking comparing last complete calendar month against the preceding month.',
    matchType: 'ANY',
    period: 'month_over_month',
    conditions: [
      { metric: 'totalRevenue', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 15 },
      { metric: 'transactions', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 15 }
    ]
  },
  {
    id: 'ecommerce_yoy_seasonal',
    name: 'Seasonal Retail Revenue Pace (YoY)',
    icon: '🎄',
    category: 'E-Commerce & Retail',
    websiteType: 'ecommerce',
    description: 'Compare last 30 days of retail revenue and sessions directly against last year to account for holiday and seasonal cycles.',
    matchType: 'ANY',
    period: 'yoy_30_days',
    conditions: [
      { metric: 'totalRevenue', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 15 },
      { metric: 'sessions', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 15 }
    ]
  },

  // ======================== LEAD GENERATION & B2B (3) ========================
  {
    id: 'form_failure',
    name: 'Lead Form Zero-Conversion Alert',
    icon: '🎯',
    category: 'Lead Generation & B2B',
    websiteType: 'lead_gen',
    description: 'Fires immediately if Key Events drop to zero or collapse (broken contact forms, CRM webhook failure, or CRM API timeout).',
    matchType: 'ANY',
    period: 'yesterday_vs_last_week',
    conditions: [
      { metric: 'keyEvents', source: 'all', medium: '', device: 'all', conditionType: 'equals_zero', thresholdPercentage: 0 },
      { metric: 'keyEvents', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 35 }
    ]
  },
  {
    id: 'form_abandonment_spike',
    name: 'SaaS Demo & Form Validation Freeze',
    icon: '⚠️',
    category: 'Lead Generation & B2B',
    websiteType: 'lead_gen',
    description: 'Engaged visitors stay high while lead submissions crash week-over-week (broken validation scripts or reCAPTCHA lockouts).',
    matchType: 'ALL',
    period: 'week_over_week',
    conditions: [
      { metric: 'engagementRate', source: 'all', medium: '', device: 'all', conditionType: 'spikes_above', thresholdPercentage: 10 },
      { metric: 'keyEvents', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 35 }
    ]
  },
  {
    id: 'b2b_mom_pipeline',
    name: 'Monthly Qualified Lead Velocity (MoM)',
    icon: '📊',
    category: 'Lead Generation & B2B',
    websiteType: 'lead_gen',
    description: 'Tracks Month-over-Month decline in Key Events or conversion rate for agency clients and B2B SaaS funnels.',
    matchType: 'ANY',
    period: 'month_over_month',
    conditions: [
      { metric: 'keyEvents', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 20 },
      { metric: 'sessionKeyEventRate', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 20 }
    ]
  },

  // ======================== SEO & CONTENT / MEDIA (3) ========================
  {
    id: 'seo_organic_drop',
    name: 'Organic Search (SEO) Traffic Drop',
    icon: '📉',
    category: 'SEO & Content / Media',
    websiteType: 'content',
    description: 'Week-over-Week monitor for Organic Search sessions and conversions (detects Google core updates, deindexing, or canonical errors).',
    matchType: 'ANY',
    period: 'week_over_week',
    conditions: [
      { metric: 'sessions', source: 'Organic Search', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 25 },
      { metric: 'keyEvents', source: 'Organic Search', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 25 }
    ]
  },
  {
    id: 'content_pageview_engagement',
    name: 'Editorial Readership & Pageviews Decline',
    icon: '📰',
    category: 'SEO & Content / Media',
    websiteType: 'content',
    description: 'Alerts publishers and content sites when total pageviews or average session duration drop significantly month-over-month.',
    matchType: 'ANY',
    period: 'month_over_month',
    conditions: [
      { metric: 'screenPageViews', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 20 },
      { metric: 'averageSessionDuration', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 20 }
    ]
  },
  {
    id: 'viral_surge',
    name: 'Viral Traffic Spike / PR Spotlight',
    icon: '📈',
    category: 'SEO & Content / Media',
    websiteType: 'content',
    description: 'Instant alert for sudden editorial traffic explosions (social virality, Google Discover features, or media mentions).',
    matchType: 'ANY',
    period: 'daily',
    conditions: [
      { metric: 'sessions', source: 'all', medium: '', device: 'all', conditionType: 'spikes_above', thresholdPercentage: 75 },
      { metric: 'newUsers', source: 'all', medium: '', device: 'all', conditionType: 'spikes_above', thresholdPercentage: 75 }
    ]
  },

  // ======================== PAID ACQUISITION (PPC) (2) ========================
  {
    id: 'paid_cpc_slump',
    name: 'Paid Search (CPC) Campaign Slump',
    icon: '💸',
    category: 'Paid Acquisition (PPC)',
    websiteType: 'paid_media',
    description: 'Alert when Paid Search CPC traffic or conversions drop week-over-week due to disapproved ads, billing stops, or broken UTMs.',
    matchType: 'ANY',
    period: 'week_over_week',
    conditions: [
      { metric: 'sessions', source: 'Paid Search', medium: 'cpc', device: 'all', conditionType: 'drops_below', thresholdPercentage: 25 },
      { metric: 'keyEvents', source: 'Paid Search', medium: 'cpc', device: 'all', conditionType: 'drops_below', thresholdPercentage: 25 }
    ]
  },
  {
    id: 'paid_social_efficiency',
    name: 'Paid Social Engagement & Traffic Guard',
    icon: '📣',
    category: 'Paid Acquisition (PPC)',
    websiteType: 'paid_media',
    description: 'Detects low-quality Meta/TikTok ad clicks when Paid Social sessions drop or Paid Social engagement rate falls below 30%.',
    matchType: 'ANY',
    period: 'week_over_week',
    conditions: [
      { metric: 'sessions', source: 'Paid Social', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 25 },
      { metric: 'engagementRate', source: 'Paid Social', medium: '', device: 'all', conditionType: 'falls_under_value', thresholdPercentage: 30 }
    ]
  },

  // ======================== SITE HEALTH, UX & SECURITY (3) ========================
  {
    id: 'outage_zero',
    name: 'Catastrophic Outage / Zero Telemetry',
    icon: '🚨',
    category: 'Site Health, UX & Security',
    websiteType: 'technical',
    description: 'Critical emergency alert if sessions hit zero or drop >50% day-over-day (site crash, expired SSL, DNS issue, or deleted GTM snippet).',
    matchType: 'ANY',
    period: 'daily',
    conditions: [
      { metric: 'sessions', source: 'all', medium: '', device: 'all', conditionType: 'equals_zero', thresholdPercentage: 0 },
      { metric: 'sessions', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 50 },
      { metric: 'activeUsers', source: 'all', medium: '', device: 'all', conditionType: 'drops_below', thresholdPercentage: 50 }
    ]
  },
  {
    id: 'bot_surge',
    name: 'Bot Traffic & Scraper Flood Detection',
    icon: '🤖',
    category: 'Site Health, UX & Security',
    websiteType: 'technical',
    description: 'Detects automated bot attacks when sessions spike sharply (+50%) while overall site engagement rate falls below 25%.',
    matchType: 'ALL',
    period: 'yesterday_vs_last_week',
    conditions: [
      { metric: 'sessions', source: 'all', medium: '', device: 'all', conditionType: 'spikes_above', thresholdPercentage: 50 },
      { metric: 'engagementRate', source: 'all', medium: '', device: 'all', conditionType: 'falls_under_value', thresholdPercentage: 25 }
    ]
  },
  {
    id: 'ux_mobile_bounce_spike',
    name: 'Mobile UX Glitch & High Bounce Spike',
    icon: '📱',
    category: 'Site Health, UX & Security',
    websiteType: 'technical',
    description: 'Catches mobile layout regressions, slow CLS/LCP, or 500 errors affecting smartphone visitors exclusively.',
    matchType: 'ALL',
    period: 'yesterday_vs_last_week',
    conditions: [
      { metric: 'bounceRate', source: 'all', medium: '', device: 'mobile', conditionType: 'spikes_above', thresholdPercentage: 35 },
      { metric: 'engagementRate', source: 'all', medium: '', device: 'mobile', conditionType: 'drops_below', thresholdPercentage: 30 }
    ]
  }
];
