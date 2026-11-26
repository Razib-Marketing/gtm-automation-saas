import type { Project, Organization, ProjectAccessGrant, AccessRole } from '../types/project';

const SANDBOX_STORAGE_KEY = 'gtmobserver_local_sandbox_v1';
export const SANDBOX_EVENT = 'gtmobserver:sandbox-updated';

export interface SandboxState {
  tier: 'free' | 'pro' | 'custom';
  googleConnected: boolean;
  organizations: Organization[];
  projectAccess: ProjectAccessGrant[];
  projects: Project[];
  monitors: any[];
  alerts: any[];
  gtmAudits: any[];
  ga4Audits: any[];
}

export const SANDBOX_GA4_PROPERTIES = [
  { name: 'properties/384910244', displayName: 'Harbor Grand Hotel & Resort - GA4' },
  { name: 'properties/491028375', displayName: 'Apex Commerce Store - GA4' },
  { name: 'properties/512039481', displayName: 'Bayside Boutique Inn - GA4' }
];

export const SANDBOX_GTM_ACCOUNTS = [
  { accountId: '6004129801', name: 'Harbor Hospitality Group' },
  { accountId: '6009841220', name: 'Apex Digital Commerce' }
];

export const SANDBOX_GTM_CONTAINERS: Record<string, Array<{ containerId: string; name: string; publicId: string }>> = {
  '6004129801': [
    { containerId: '18422091', name: 'harborgrandhotel.com', publicId: 'GTM-HARB01' },
    { containerId: '18422099', name: 'baysideinn.com', publicId: 'GTM-BAYS03' }
  ],
  '6009841220': [
    { containerId: '19388410', name: 'apexcommerce.io', publicId: 'GTM-APEX02' }
  ]
};

export const SANDBOX_GTM_WORKSPACES: Record<string, Array<{ workspaceId: string; name: string }>> = {
  '18422091': [
    { workspaceId: '12', name: 'Default Workspace' },
    { workspaceId: '15', name: 'Synxis Booking Setup' }
  ],
  '18422099': [{ workspaceId: '4', name: 'Default Workspace' }],
  '19388410': [{ workspaceId: '7', name: 'Production Telemetry' }]
};

export function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
}

function buildDefaultSeedState(): SandboxState {
  const nowIso = new Date().toISOString();
  const organizations: Organization[] = [
    {
      id: 'org_demo_hospitality',
      name: 'Harbor Hospitality Group',
      slug: 'harbor-hospitality',
      description: '50-property hotel & resort management portfolio',
      owner_user_id: 'sandbox_user',
      role: 'owner',
      members: [
        {
          id: 'om_demo_1',
          organization_id: 'org_demo_hospitality',
          user_id: 'sandbox_user',
          email: 'ovi@razibmarketing.net',
          role: 'owner',
          status: 'active'
        },
        {
          id: 'om_demo_2',
          organization_id: 'org_demo_hospitality',
          email: 'analytics@cogwheelmarketing.com',
          role: 'admin',
          status: 'active'
        }
      ],
      created_at: nowIso
    }
  ];

  const projects: Project[] = [
    {
      id: 'proj_demo_harbor',
      organization_id: 'org_demo_hospitality',
      organization_name: 'Harbor Hospitality Group',
      name: 'Harbor Grand Hotel & Resort',
      website_url: 'https://harborgrandhotel.com',
      website_type: 'hospitality',
      gtm_account_id: '6004129801',
      gtm_account_name: 'Harbor Hospitality Group',
      gtm_container_id: '18422091',
      gtm_container_name: 'harborgrandhotel.com',
      gtm_container_public_id: 'GTM-HARB01',
      gtm_workspace_id: '15',
      gtm_workspace_name: 'Synxis Booking Setup',
      ga4_property_id: 'properties/384910244',
      ga4_property_name: 'Harbor Grand Hotel & Resort - GA4',
      measurement_id: 'G-HARB01GA4',
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso
    },
    {
      id: 'proj_demo_apex',
      name: 'Apex Commerce Store',
      website_url: 'https://apexcommerce.io',
      website_type: 'ecommerce',
      gtm_account_id: '6009841220',
      gtm_account_name: 'Apex Digital Commerce',
      gtm_container_id: '19388410',
      gtm_container_name: 'apexcommerce.io',
      gtm_container_public_id: 'GTM-APEX02',
      gtm_workspace_id: '7',
      gtm_workspace_name: 'Production Telemetry',
      ga4_property_id: 'properties/491028375',
      ga4_property_name: 'Apex Commerce Store - GA4',
      measurement_id: 'G-APEX02GA4',
      status: 'active',
      created_at: nowIso,
      updated_at: nowIso
    }
  ];

  const monitors = [
    {
      id: 'mon_demo_harbor_rev',
      project_id: 'proj_demo_harbor',
      property_id: 'properties/384910244',
      property_name: 'Harbor Grand Hotel & Resort - GA4',
      metric: 'totalRevenue',
      threshold_percentage: 25,
      comparison_period: 'week_over_week',
      alert_email: 'revops@harborgrandhotel.com, analytics@razibmarketing.com',
      condition_type: 'drops_below',
      matchType: 'ANY',
      scheduleTime: '08:00',
      scheduleTimezone: 'America/New_York',
      scheduleFrequency: 'daily',
      websiteType: 'hospitality',
      status: 'active',
      conditions: [
        {
          metric: 'totalRevenue',
          source: 'all',
          medium: 'all',
          device: 'all',
          conditionType: 'drops_below',
          thresholdPercentage: 25
        },
        {
          metric: 'transactions',
          source: 'Organic Search',
          medium: 'all',
          device: 'mobile',
          conditionType: 'equals_zero',
          thresholdPercentage: 0
        }
      ]
    },
    {
      id: 'mon_demo_apex_checkout',
      project_id: 'proj_demo_apex',
      property_id: 'properties/491028375',
      property_name: 'Apex Commerce Store - GA4',
      metric: 'transactions',
      threshold_percentage: 20,
      comparison_period: 'yesterday_vs_last_week',
      alert_email: 'growth@apexcommerce.io',
      condition_type: 'drops_below',
      matchType: 'ALL',
      scheduleTime: '09:00',
      scheduleTimezone: 'America/Los_Angeles',
      scheduleFrequency: 'daily',
      websiteType: 'ecommerce',
      status: 'active',
      conditions: [
        {
          metric: 'transactions',
          source: 'all',
          medium: 'all',
          device: 'all',
          conditionType: 'drops_below',
          thresholdPercentage: 20
        }
      ]
    }
  ];

  const alerts = [
    {
      id: 'alt_demo_harbor_1',
      monitor_id: 'mon_demo_harbor_rev',
      project_id: 'proj_demo_harbor',
      property_name: 'Harbor Grand Hotel & Resort - GA4',
      metric: 'Manual Health Check: All 2 Condition(s) Stable',
      condition_type: 'stable',
      percent_change: 8.4,
      alert_type: 'manual',
      status: 'stable',
      recipients: 'revops@harborgrandhotel.com',
      created_at: nowIso
    },
    {
      id: 'alt_demo_apex_1',
      monitor_id: 'mon_demo_apex_checkout',
      project_id: 'proj_demo_apex',
      property_name: 'Apex Commerce Store - GA4',
      metric: 'transactions [Paid Search]',
      condition_type: 'drops_below',
      percent_change: -24.6,
      alert_type: 'automated',
      status: 'anomaly',
      recipients: 'growth@apexcommerce.io',
      created_at: nowIso
    }
  ];

  const gtmAudits = [
    {
      id: 'gtm_aud_demo_harbor',
      projectId: 'proj_demo_harbor',
      gtmId: 'GTM-HARB01',
      healthScore: 92,
      issueCount: 1,
      tagCount: 18,
      triggerCount: 14,
      variableCount: 11,
      rawData: {
        summary: {
          healthScore: 92,
          totalTags: 18,
          totalTriggers: 14,
          totalVariables: 11,
          criticalCount: 0,
          warningCount: 1
        },
        issues: [
          {
            id: 'unlinked_var_1',
            type: 'UNUSED_VARIABLE',
            severity: 'warning',
            title: '1 Unused Legacy Variable',
            description: 'DLV - legacy_hotel_code is not referenced in any active tag or trigger.',
            items: ['DLV - legacy_hotel_code']
          }
        ],
        recommendations: [
          'Remove unused DLV - legacy_hotel_code before publishing next workspace version.'
        ]
      },
      createdAt: nowIso
    },
    {
      id: 'gtm_aud_demo_apex',
      projectId: 'proj_demo_apex',
      gtmId: 'GTM-APEX02',
      healthScore: 84,
      issueCount: 2,
      tagCount: 24,
      triggerCount: 19,
      variableCount: 16,
      rawData: {
        summary: {
          healthScore: 84,
          totalTags: 24,
          totalTriggers: 19,
          totalVariables: 16,
          criticalCount: 1,
          warningCount: 1
        },
        issues: [
          {
            id: 'dup_purchase',
            type: 'DUPLICATE_TAG',
            severity: 'critical',
            title: 'Duplicate GA4 Purchase Tag Candidate',
            description: 'Two tags listen to the custom "purchase" DataLayer event.',
            items: ['GA4 Event - purchase', 'GA4 Legacy - purchase_v1']
          }
        ],
        recommendations: ['Pause or delete GA4 Legacy - purchase_v1 to avoid double-counted revenue.']
      },
      createdAt: nowIso
    }
  ];

  const ga4Audits = [
    {
      id: 'ga4_aud_demo_harbor',
      projectId: 'proj_demo_harbor',
      propertyId: 'properties/384910244',
      propertyName: 'Harbor Grand Hotel & Resort - GA4',
      healthScore: 76,
      criticalCount: 2,
      warningCount: 4,
      passedCount: 16,
      createdAt: nowIso
    },
    {
      id: 'ga4_aud_demo_apex',
      projectId: 'proj_demo_apex',
      propertyId: 'properties/491028375',
      propertyName: 'Apex Commerce Store - GA4',
      healthScore: 89,
      criticalCount: 1,
      warningCount: 2,
      passedCount: 19,
      createdAt: nowIso
    }
  ];

  const projectAccess: ProjectAccessGrant[] = [
    {
      id: 'pa_demo_1',
      project_id: 'proj_demo_apex',
      project_name: 'Apex Commerce Store',
      granted_to_email: 'growth@apexcommerce.io',
      role: 'editor',
      granted_by_email: 'ovi@razibmarketing.net',
      created_at: nowIso
    }
  ];

  return {
    tier: 'pro',
    googleConnected: true,
    organizations,
    projectAccess,
    projects,
    monitors,
    alerts,
    gtmAudits,
    ga4Audits
  };
}

function saveState(state: SandboxState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(SANDBOX_EVENT));
}

export function getSandboxState(): SandboxState {
  if (typeof window === 'undefined') {
    return buildDefaultSeedState();
  }
  try {
    const raw = window.localStorage.getItem(SANDBOX_STORAGE_KEY);
    if (!raw) {
      const seed = buildDefaultSeedState();
      saveState(seed);
      return seed;
    }
    const parsed = JSON.parse(raw);
    return {
      tier: parsed.tier || 'pro',
      googleConnected: Boolean(parsed.googleConnected),
      organizations: Array.isArray(parsed.organizations) ? parsed.organizations : [],
      projectAccess: Array.isArray(parsed.projectAccess) ? parsed.projectAccess : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      monitors: Array.isArray(parsed.monitors) ? parsed.monitors : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
      gtmAudits: Array.isArray(parsed.gtmAudits) ? parsed.gtmAudits : [],
      ga4Audits: Array.isArray(parsed.ga4Audits) ? parsed.ga4Audits : []
    };
  } catch (_) {
    const seed = buildDefaultSeedState();
    saveState(seed);
    return seed;
  }
}

export function getEnrichedSandboxProjects(): Project[] {
  const s = getSandboxState();
  const orgLookup = new Map((s.organizations || []).map((o) => [o.id, o.name]));
  return s.projects.map((p) => {
    const isTrashed = p.status === 'trashed';
    const pMonitors = s.monitors.filter(
      (m) =>
        (isTrashed || m.status !== 'trashed') &&
        (m.project_id === p.id || (!m.project_id && p.ga4_property_id && m.property_id === p.ga4_property_id))
    );
    const monIds = new Set(pMonitors.map((m) => m.id));
    const pAlerts = s.alerts.filter((a) => a.project_id === p.id || monIds.has(a.monitor_id));
    const pGtmAudits = s.gtmAudits.filter(
      (a) => a.projectId === p.id || (p.gtm_container_public_id && a.gtmId === p.gtm_container_public_id)
    );
    const pGa4Audits = s.ga4Audits.filter(
      (a) => a.projectId === p.id || (p.ga4_property_id && a.propertyId === p.ga4_property_id)
    );
    const sharedCnt = (s.projectAccess || []).filter((pa) => pa.project_id === p.id).length;
    return {
      ...p,
      organization_name: p.organization_id ? orgLookup.get(p.organization_id) || p.organization_name || null : null,
      monitorCount: pMonitors.length,
      alertCount: pAlerts.length,
      recentAlertCount: pAlerts.length,
      gtmAuditCount: pGtmAudits.length,
      ga4AuditCount: pGa4Audits.length,
      latestGtmScore: pGtmAudits[0]?.healthScore ?? null,
      latestGa4Score: pGa4Audits[0]?.healthScore ?? null,
      sharedWithCount: sharedCnt,
      accessRole: p.accessRole || 'owner',
      accessSource: p.accessSource || 'owner'
    };
  });
}

export function setSandboxTier(tier: 'free' | 'pro' | 'custom') {
  const s = getSandboxState();
  s.tier = tier;
  saveState(s);
}

export function setSandboxGoogleConnected(connected: boolean) {
  const s = getSandboxState();
  s.googleConnected = connected;
  saveState(s);
}

export function addSandboxProject(input: Partial<Project> & { name: string }): Project {
  const s = getSandboxState();
  const nowIso = new Date().toISOString();
  const created: Project = {
    id: 'proj_loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    organization_id: input.organization_id || null,
    organization_name: input.organization_name || null,
    name: input.name,
    website_url: input.website_url || '',
    website_type: input.website_type || 'general',
    gtm_account_id: input.gtm_account_id || null,
    gtm_account_name: input.gtm_account_name || null,
    gtm_container_id: input.gtm_container_id || null,
    gtm_container_name: input.gtm_container_name || null,
    gtm_container_public_id: input.gtm_container_public_id || null,
    gtm_workspace_id: input.gtm_workspace_id || null,
    gtm_workspace_name: input.gtm_workspace_name || null,
    ga4_property_id: input.ga4_property_id || null,
    ga4_property_name: input.ga4_property_name || null,
    measurement_id: input.measurement_id || null,
    status: 'active',
    deleted_at: null,
    created_at: nowIso,
    updated_at: nowIso
  };
  s.projects = [created, ...s.projects];
  saveState(s);
  return created;
}

export function updateSandboxProject(projectId: string, patch: Partial<Project>): Project | null {
  const s = getSandboxState();
  let updated: Project | null = null;
  s.projects = s.projects.map((p) => {
    if (p.id !== projectId) return p;
    updated = { ...p, ...patch, updated_at: new Date().toISOString() };
    return updated;
  });
  saveState(s);
  return updated;
}

export function trashSandboxProject(projectId: string) {
  const s = getSandboxState();
  const nowIso = new Date().toISOString();
  s.projects = s.projects.map((p) =>
    p.id === projectId ? { ...p, status: 'trashed', deleted_at: nowIso, updated_at: nowIso } : p
  );
  s.monitors = s.monitors.map((m) =>
    m.project_id === projectId ? { ...m, status: 'trashed' } : m
  );
  saveState(s);
}

export function restoreSandboxProject(projectId: string) {
  const s = getSandboxState();
  const nowIso = new Date().toISOString();
  s.projects = s.projects.map((p) =>
    p.id === projectId ? { ...p, status: 'active', deleted_at: null, updated_at: nowIso } : p
  );
  s.monitors = s.monitors.map((m) =>
    m.project_id === projectId ? { ...m, status: 'active' } : m
  );
  saveState(s);
}

export function deleteSandboxProject(projectId: string) {
  const s = getSandboxState();
  s.projects = s.projects.filter((p) => p.id !== projectId);
  s.monitors = s.monitors.filter((m) => m.project_id !== projectId);
  s.alerts = s.alerts.filter((a) => a.project_id !== projectId);
  s.projectAccess = (s.projectAccess || []).filter((pa) => pa.project_id !== projectId);
  saveState(s);
}

export function emptySandboxTrash() {
  const s = getSandboxState();
  const trashedIds = new Set(s.projects.filter((p) => p.status === 'trashed').map((p) => p.id));
  s.projects = s.projects.filter((p) => p.status !== 'trashed');
  s.monitors = s.monitors.filter((m) => !trashedIds.has(m.project_id));
  s.alerts = s.alerts.filter((a) => !trashedIds.has(a.project_id));
  s.projectAccess = (s.projectAccess || []).filter((pa) => !trashedIds.has(pa.project_id));
  saveState(s);
}

export function addSandboxOrganization(input: { name: string; description?: string }): Organization {
  const s = getSandboxState();
  const org: Organization = {
    id: 'org_loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: input.name,
    description: input.description || '',
    owner_user_id: 'sandbox_user',
    role: 'owner',
    members: [
      {
        id: 'om_loc_' + Date.now(),
        organization_id: '',
        email: 'ovi@razibmarketing.net',
        role: 'owner',
        status: 'active'
      }
    ],
    created_at: new Date().toISOString()
  };
  s.organizations = [org, ...(s.organizations || [])];
  saveState(s);
  return org;
}

export function deleteSandboxOrganization(orgId: string) {
  const s = getSandboxState();
  s.organizations = (s.organizations || []).filter((o) => o.id !== orgId);
  s.projects = s.projects.map((p) =>
    p.organization_id === orgId ? { ...p, organization_id: null, organization_name: null } : p
  );
  saveState(s);
}

export function assignSandboxProjectsToOrg(projectIds: string[], organizationId: string | null) {
  const s = getSandboxState();
  const setIds = new Set(projectIds);
  const orgName = organizationId
    ? (s.organizations || []).find((o) => o.id === organizationId)?.name || null
    : null;
  s.projects = s.projects.map((p) =>
    setIds.has(p.id) ? { ...p, organization_id: organizationId, organization_name: orgName } : p
  );
  saveState(s);
}

export function addSandboxOrgMember(orgId: string, email: string, role: AccessRole) {
  const s = getSandboxState();
  const cleanEmail = email.toLowerCase().trim();
  s.organizations = (s.organizations || []).map((o) => {
    if (o.id !== orgId) return o;
    const members = [...(o.members || [])];
    const idx = members.findIndex((m) => m.email.toLowerCase() === cleanEmail);
    const entry = {
      id: idx >= 0 ? members[idx].id : 'om_loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      organization_id: orgId,
      email: cleanEmail,
      role,
      status: 'active' as const,
      created_at: new Date().toISOString()
    };
    if (idx >= 0) members[idx] = entry;
    else members.push(entry);
    return { ...o, members, memberCount: members.length };
  });
  saveState(s);
}

export function updateSandboxOrgMember(orgId: string, memberId: string, role: AccessRole) {
  const s = getSandboxState();
  s.organizations = (s.organizations || []).map((o) => {
    if (o.id !== orgId) return o;
    const members = (o.members || []).map((m) => (m.id === memberId ? { ...m, role } : m));
    return { ...o, members };
  });
  saveState(s);
}

export function removeSandboxOrgMember(orgId: string, memberId: string) {
  const s = getSandboxState();
  s.organizations = (s.organizations || []).map((o) => {
    if (o.id !== orgId) return o;
    const members = (o.members || []).filter((m) => m.id !== memberId || m.role === 'owner');
    return { ...o, members, memberCount: members.length };
  });
  saveState(s);
}

export function grantSandboxProjectAccess(projectIds: string[], emails: string[], role: AccessRole) {
  const s = getSandboxState();
  const nowIso = new Date().toISOString();
  const next = [...(s.projectAccess || [])];
  for (const pid of projectIds) {
    const proj = s.projects.find((p) => p.id === pid);
    for (const email of emails) {
      const cleanEmail = email.toLowerCase().trim();
      const idx = next.findIndex((g) => g.project_id === pid && g.granted_to_email === cleanEmail);
      const item: ProjectAccessGrant = {
        id: idx >= 0 ? next[idx].id : 'pa_loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        project_id: pid,
        project_name: proj?.name || pid,
        granted_to_email: cleanEmail,
        role,
        granted_by_email: 'ovi@razibmarketing.net',
        created_at: nowIso
      };
      if (idx >= 0) next[idx] = item;
      else next.unshift(item);
    }
  }
  s.projectAccess = next;
  saveState(s);
}

export function revokeSandboxProjectAccess(grantId: string) {
  const s = getSandboxState();
  s.projectAccess = (s.projectAccess || []).filter((g) => g.id !== grantId);
  saveState(s);
}

export function addSandboxMonitor(monitorInput: any) {
  const s = getSandboxState();
  const id = monitorInput.id || 'mon_loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const existingIdx = s.monitors.findIndex((m) => m.id === id);
  const normalized = {
    ...monitorInput,
    id,
    created_at: monitorInput.created_at || new Date().toISOString()
  };
  if (existingIdx >= 0) {
    s.monitors[existingIdx] = normalized;
  } else {
    s.monitors = [normalized, ...s.monitors];
  }
  saveState(s);
  return normalized;
}

export function deleteSandboxMonitor(monitorId: string) {
  const s = getSandboxState();
  s.monitors = s.monitors.filter((m) => m.id !== monitorId);
  saveState(s);
}

export function resetSandboxToNewUser() {
  saveState({
    tier: 'free',
    googleConnected: false,
    organizations: [],
    projectAccess: [],
    projects: [],
    monitors: [],
    alerts: [],
    gtmAudits: [],
    ga4Audits: []
  });
}

export function seedSandboxSampleProjects() {
  saveState(buildDefaultSeedState());
}
