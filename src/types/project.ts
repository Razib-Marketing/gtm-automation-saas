export type WebsitePerspective =
  | 'general'
  | 'hospitality'
  | 'ecommerce'
  | 'leadgen'
  | 'saas'
  | 'content';

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  website_url?: string | null;
  website_type?: WebsitePerspective | string;
  gtm_account_id?: string | null;
  gtm_account_name?: string | null;
  gtm_container_id?: string | null;
  gtm_container_name?: string | null;
  gtm_container_public_id?: string | null;
  gtm_workspace_id?: string | null;
  gtm_workspace_name?: string | null;
  ga4_property_id?: string | null;
  ga4_property_name?: string | null;
  measurement_id?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  monitorCount?: number;
  alertCount?: number;
  recentAlertCount?: number;
  gtmAuditCount?: number;
  ga4AuditCount?: number;
  latestGtmScore?: number | null;
  latestGa4Score?: number | null;
}

export const WEBSITE_TYPES: Array<{
  value: WebsitePerspective;
  label: string;
  badge: string;
  color: string;
  description: string;
}> = [
  {
    value: 'general',
    label: 'All / General Business',
    badge: 'General',
    color: '#00F0FF',
    description: 'Standard brand websites, corporate portals, and multi-purpose landing pages'
  },
  {
    value: 'hospitality',
    label: 'Hospitality & Hotels',
    badge: 'Hospitality',
    color: '#F59E0B',
    description: 'Hotels, resorts, booking engines (Synxis, Mews, iHotelier, StayNTouch, Safara)'
  },
  {
    value: 'ecommerce',
    label: 'E-Commerce & Retail',
    badge: 'E-Commerce',
    color: '#10B981',
    description: 'WooCommerce & online stores tracking add_to_cart, checkout, and purchase revenue'
  },
  {
    value: 'leadgen',
    label: 'Lead Generation & B2B',
    badge: 'Lead Gen',
    color: '#A855F7',
    description: 'Service businesses tracking form submissions, RFPs, calls, and inbound leads'
  },
  {
    value: 'saas',
    label: 'SaaS & Web Apps',
    badge: 'SaaS',
    color: '#38BDF8',
    description: 'Subscription apps tracking trial signups, feature activation, and engagement'
  },
  {
    value: 'content',
    label: 'Content & Media',
    badge: 'Media',
    color: '#EC4899',
    description: 'Publishers & blogs focused on engaged sessions, scroll depth, and video plays'
  }
];

export function getWebsiteTypeMeta(type?: string | null) {
  return (
    WEBSITE_TYPES.find((t) => t.value === type) || WEBSITE_TYPES[0]
  );
}
