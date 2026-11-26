export interface MonitorConditionInput {
  metric: string;
  source?: string;
  medium?: string;
  device?: string;
  conditionType: string;
  condition_type?: string;
  thresholdPercentage?: number;
  threshold_percentage?: number;
}

export interface EvaluatedCondition {
  metric: string;
  source: string;
  medium: string;
  device: string;
  conditionType: string;
  thresholdPercentage: number;
  currentVal: number;
  pastVal: number;
  formattedCurrent: string;
  formattedPast: string;
  percentChange: number;
  isTriggered: boolean;
  actionText: string;
  operatorLabel: string;
}

export async function ensureUsersSchema(db: any) {
  try {
    await db.prepare("ALTER TABLE users ADD COLUMN schedule_time TEXT DEFAULT '08:00'").run();
  } catch (_) {}
  try {
    await db.prepare("ALTER TABLE users ADD COLUMN schedule_timezone TEXT DEFAULT 'UTC'").run();
  } catch (_) {}
}

export async function ensureMonitorsSchema(db: any) {
  try {
    await db.prepare("ALTER TABLE ga4_monitors ADD COLUMN schedule_time TEXT DEFAULT '08:00'").run();
  } catch (_) {}
  try {
    await db.prepare("ALTER TABLE ga4_monitors ADD COLUMN schedule_timezone TEXT DEFAULT 'UTC'").run();
  } catch (_) {}
  try {
    await db.prepare("ALTER TABLE ga4_monitors ADD COLUMN schedule_frequency TEXT DEFAULT 'daily'").run();
  } catch (_) {}
  try {
    await db.prepare("ALTER TABLE ga4_monitors ADD COLUMN last_run_local_date TEXT").run();
  } catch (_) {}
  try {
    await db.prepare("ALTER TABLE ga4_monitors ADD COLUMN website_type TEXT DEFAULT 'general'").run();
  } catch (_) {}
}

export async function ensureAlertsSchema(db: any) {
  try {
    await db.prepare("ALTER TABLE ga4_alerts ADD COLUMN alert_type TEXT DEFAULT 'automated'").run();
  } catch (_) {}
  try {
    await db.prepare("ALTER TABLE ga4_alerts ADD COLUMN status TEXT DEFAULT 'anomaly'").run();
  } catch (_) {}
  try {
    await db.prepare("ALTER TABLE ga4_alerts ADD COLUMN recipients TEXT").run();
  } catch (_) {}
  try {
    await db.prepare('ALTER TABLE ga4_alerts ADD COLUMN project_id TEXT').run();
  } catch (_) {}
}

export async function ensureOrganizationsSchema(db: any) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        clerk_org_id TEXT,
        name TEXT NOT NULL,
        slug TEXT,
        description TEXT,
        owner_user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (_) {}

  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS organization_members (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        user_id TEXT,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        invited_by TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(organization_id, email)
      )
    `).run();
  } catch (_) {}

  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS project_access (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        granted_to_user_id TEXT,
        granted_to_email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'editor',
        granted_by_user_id TEXT NOT NULL,
        granted_by_email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, granted_to_email)
      )
    `).run();
  } catch (_) {}

  const orgMigrations = [
    'ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMP',
    'ALTER TABLE projects ADD COLUMN organization_id TEXT',
    'CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id)',
    'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)',
    'CREATE INDEX IF NOT EXISTS idx_proj_access_pid ON project_access(project_id)',
    'CREATE INDEX IF NOT EXISTS idx_proj_access_email ON project_access(granted_to_email)',
    'CREATE INDEX IF NOT EXISTS idx_proj_access_uid ON project_access(granted_to_user_id)',
    'CREATE INDEX IF NOT EXISTS idx_org_members_oid ON organization_members(organization_id)',
    'CREATE INDEX IF NOT EXISTS idx_org_members_email ON organization_members(email)',
    'CREATE INDEX IF NOT EXISTS idx_org_clerk_id ON organizations(clerk_org_id)'
  ];

  for (const sql of orgMigrations) {
    try {
      await db.prepare(sql).run();
    } catch (_) {}
  }
}

export async function ensureProjectsSchema(db: any) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        website_url TEXT,
        website_type TEXT DEFAULT 'general',
        gtm_account_id TEXT,
        gtm_account_name TEXT,
        gtm_container_id TEXT,
        gtm_container_name TEXT,
        gtm_container_public_id TEXT,
        gtm_workspace_id TEXT,
        gtm_workspace_name TEXT,
        ga4_property_id TEXT,
        ga4_property_name TEXT,
        measurement_id TEXT,
        status TEXT DEFAULT 'active',
        deleted_at TIMESTAMP,
        organization_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (_) {}

  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ga4_audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        project_id TEXT,
        property_id TEXT NOT NULL,
        property_name TEXT,
        health_score INTEGER NOT NULL,
        critical_count INTEGER DEFAULT 0,
        warning_count INTEGER DEFAULT 0,
        passed_count INTEGER DEFAULT 0,
        raw_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
  } catch (_) {}

  const migrations = [
    'ALTER TABLE ga4_monitors ADD COLUMN project_id TEXT',
    'ALTER TABLE ga4_alerts ADD COLUMN project_id TEXT',
    'ALTER TABLE audit_logs ADD COLUMN project_id TEXT',
    'ALTER TABLE ga4_audit_logs ADD COLUMN project_id TEXT',
    "ALTER TABLE projects ADD COLUMN website_type TEXT DEFAULT 'general'",
    'ALTER TABLE projects ADD COLUMN gtm_container_name TEXT',
    'ALTER TABLE projects ADD COLUMN measurement_id TEXT'
  ];

  for (const sql of migrations) {
    try {
      await db.prepare(sql).run();
    } catch (_) {}
  }

  await ensureOrganizationsSchema(db);
}

export interface ClerkAuthContext {
  userId: string;
  orgId: string | null;
  orgRole: string | null;
  email: string | null;
}

export function getClerkAuthContext(request: Request): ClerkAuthContext | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') return null;
  const parts = token.split('.');
  if (parts.length < 2 || !parts[1]) return null;
  try {
    let payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payloadBase64.length % 4) {
      payloadBase64 += '=';
    }
    const payload = JSON.parse(atob(payloadBase64));
    if (!payload.sub) return null;

    // Support both Clerk v1 (org_id, org_role) and v2 (o.id, o.rol) session JWT claims
    const orgId = payload.org_id || payload.o?.id || null;
    const orgRole = payload.org_role || payload.o?.rol || null;
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : null;

    return {
      userId: payload.sub,
      orgId: orgId ? String(orgId) : null,
      orgRole: orgRole ? String(orgRole) : null,
      email
    };
  } catch (_) {
    return null;
  }
}

export function getClerkUserId(request: Request): string | null {
  return getClerkAuthContext(request)?.userId || null;
}

export type AccessRole = 'owner' | 'admin' | 'editor' | 'viewer';

export function normalizeAccessRole(raw?: string | null): AccessRole {
  const r = (raw || '').toLowerCase().trim();
  if (r === 'owner') return 'owner';
  if (r === 'admin' || r === 'org:admin') return 'admin';
  if (r === 'viewer' || r === 'read' || r === 'readonly') return 'viewer';
  return 'editor';
}

export function roleRank(role: AccessRole | string | null | undefined): number {
  switch (normalizeAccessRole(role)) {
    case 'owner':
      return 4;
    case 'admin':
      return 3;
    case 'editor':
      return 2;
    case 'viewer':
    default:
      return 1;
  }
}

export function canEditProject(role: AccessRole | string | null | undefined): boolean {
  return roleRank(role) >= 2;
}

export function canManageProject(role: AccessRole | string | null | undefined): boolean {
  return roleRank(role) >= 3;
}

export function canShareProject(role: AccessRole | string | null | undefined): boolean {
  return roleRank(role) >= 2;
}

export async function resolveUserEmail(db: any, userId: string): Promise<string> {
  if (!db || !userId) return '';
  try {
    const row: any = await db.prepare('SELECT email FROM users WHERE id = ?').bind(userId).first();
    return (row?.email || '').toLowerCase().trim();
  } catch (_) {
    return '';
  }
}

export async function claimPendingAccess(db: any, userId: string, email?: string | null): Promise<void> {
  if (!db || !userId) return;
  const resolvedEmail = (email || (await resolveUserEmail(db, userId))).toLowerCase().trim();
  if (!resolvedEmail || resolvedEmail === 'unknown@example.com') return;
  try {
    await db
      .prepare('UPDATE project_access SET granted_to_user_id = ? WHERE LOWER(granted_to_email) = LOWER(?) AND (granted_to_user_id IS NULL OR granted_to_user_id != ?)')
      .bind(userId, resolvedEmail, userId)
      .run();
  } catch (_) {}
  try {
    await db
      .prepare("UPDATE organization_members SET user_id = ?, status = 'active' WHERE LOWER(email) = LOWER(?) AND (user_id IS NULL OR user_id != ?)")
      .bind(userId, resolvedEmail, userId)
      .run();
  } catch (_) {}
}

export interface ResolvedProjectAccess {
  project: any;
  role: AccessRole;
  source: 'owner' | 'organization' | 'shared';
}

export async function resolveProjectAccess(
  db: any,
  auth: ClerkAuthContext | string,
  projectId: string,
  options?: { allowTrashed?: boolean }
): Promise<ResolvedProjectAccess | null> {
  if (!db || !projectId) return null;
  const ctx: ClerkAuthContext =
    typeof auth === 'string'
      ? { userId: auth, orgId: null, orgRole: null, email: null }
      : auth;

  const project: any = await db
    .prepare('SELECT * FROM projects WHERE id = ? LIMIT 1')
    .bind(projectId)
    .first();

  if (!project) return null;
  if (!options?.allowTrashed && project.status === 'trashed') return null;

  if (project.user_id === ctx.userId) {
    return { project, role: 'owner', source: 'owner' };
  }

  const userEmail = ctx.email || (await resolveUserEmail(db, ctx.userId));

  let bestRole: AccessRole | null = null;
  let bestSource: 'owner' | 'organization' | 'shared' = 'shared';

  // Check organization-level access if project belongs to an organization
  if (project.organization_id) {
    const org: any = await db
      .prepare('SELECT * FROM organizations WHERE id = ? LIMIT 1')
      .bind(project.organization_id)
      .first();

    if (org) {
      if (org.owner_user_id === ctx.userId) {
        return { project, role: 'admin', source: 'organization' };
      }

      if (ctx.orgId && org.clerk_org_id && org.clerk_org_id === ctx.orgId) {
        const cRole: AccessRole = ctx.orgRole?.toLowerCase().includes('admin') ? 'admin' : 'editor';
        if (!bestRole || roleRank(cRole) > roleRank(bestRole)) {
          bestRole = cRole;
          bestSource = 'organization';
        }
      }

      const memberRow: any = await db
        .prepare(
          `SELECT role FROM organization_members
           WHERE organization_id = ? AND (user_id = ? OR (? != '' AND LOWER(email) = LOWER(?)))
           LIMIT 1`
        )
        .bind(project.organization_id, ctx.userId, userEmail, userEmail)
        .first();

      if (memberRow) {
        const mRole = normalizeAccessRole(memberRow.role);
        if (!bestRole || roleRank(mRole) > roleRank(bestRole)) {
          bestRole = mRole;
          bestSource = 'organization';
        }
      }
    }
  }

  // Check universal direct project_access grant
  const grantRow: any = await db
    .prepare(
      `SELECT role FROM project_access
       WHERE project_id = ? AND (granted_to_user_id = ? OR (? != '' AND LOWER(granted_to_email) = LOWER(?)))
       LIMIT 1`
    )
    .bind(projectId, ctx.userId, userEmail, userEmail)
    .first();

  if (grantRow) {
    const gRole = normalizeAccessRole(grantRow.role);
    if (!bestRole || roleRank(gRole) > roleRank(bestRole)) {
      bestRole = gRole;
      bestSource = 'shared';
    }
  }

  if (!bestRole) return null;
  return { project, role: bestRole, source: bestSource };
}

export async function resolveOrganizationAccess(
  db: any,
  auth: ClerkAuthContext | string,
  organizationId: string
): Promise<{ organization: any; role: AccessRole } | null> {
  if (!db || !organizationId) return null;
  const ctx: ClerkAuthContext =
    typeof auth === 'string'
      ? { userId: auth, orgId: null, orgRole: null, email: null }
      : auth;

  const org: any = await db
    .prepare('SELECT * FROM organizations WHERE id = ? LIMIT 1')
    .bind(organizationId)
    .first();

  if (!org) return null;
  if (org.owner_user_id === ctx.userId) {
    return { organization: org, role: 'owner' };
  }

  let bestRole: AccessRole | null = null;
  if (ctx.orgId && org.clerk_org_id && org.clerk_org_id === ctx.orgId) {
    bestRole = ctx.orgRole?.toLowerCase().includes('admin') ? 'admin' : 'editor';
  }

  const userEmail = ctx.email || (await resolveUserEmail(db, ctx.userId));
  const memberRow: any = await db
    .prepare(
      `SELECT role FROM organization_members
       WHERE organization_id = ? AND (user_id = ? OR (? != '' AND LOWER(email) = LOWER(?)))
       LIMIT 1`
    )
    .bind(organizationId, ctx.userId, userEmail, userEmail)
    .first();

  if (memberRow) {
    const mRole = normalizeAccessRole(memberRow.role);
    if (!bestRole || roleRank(mRole) > roleRank(bestRole)) {
      bestRole = mRole;
    }
  }

  if (!bestRole) return null;
  return { organization: org, role: bestRole };
}

export function isValidTimeHHMM(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(val.trim());
}

export function isValidTimezone(tz?: string | null): boolean {
  if (!tz || typeof tz !== 'string' || !tz.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz.trim() });
    return true;
  } catch (_) {
    return false;
  }
}

export function sanitizeTimezone(tz?: string | null): string {
  if (isValidTimezone(tz)) {
    return (tz as string).trim();
  }
  return 'UTC';
}

export function getLocalDateParts(now: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
  localDate: string;
} {
  const safeTz = sanitizeTimezone(timeZone);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23'
  });

  const parts = formatter.formatToParts(now);
  const lookup: Record<string, string> = {};
  for (const p of parts) {
    lookup[p.type] = p.value;
  }

  const year = parseInt(lookup.year, 10);
  const month = parseInt(lookup.month, 10);
  const day = parseInt(lookup.day, 10);
  const hour = parseInt(lookup.hour, 10) % 24;
  const minute = parseInt(lookup.minute, 10);
  const weekday = lookup.weekday || '';
  const localDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return { year, month, day, hour, minute, weekday, localDate };
}

export function isMonitorDue(
  monitor: any,
  nowUtc: Date,
  forceRun = false
): {
  due: boolean;
  reason: string;
  timeZone: string;
  targetTime: string;
  frequency: string;
  localDate: string;
} {
  const timeZone = sanitizeTimezone(monitor.schedule_timezone || monitor.user_schedule_timezone || 'UTC');
  const targetTime = isValidTimeHHMM(monitor.schedule_time)
    ? monitor.schedule_time.trim()
    : isValidTimeHHMM(monitor.user_schedule_time)
      ? monitor.user_schedule_time.trim()
      : '08:00';
  const rawFreq = (monitor.schedule_frequency || 'daily').toLowerCase();
  const frequency = ['daily', 'weekly', 'monthly'].includes(rawFreq) ? rawFreq : 'daily';

  const parts = getLocalDateParts(nowUtc, timeZone);

  if (forceRun) {
    return {
      due: true,
      reason: 'forced',
      timeZone,
      targetTime,
      frequency,
      localDate: parts.localDate
    };
  }

  if (monitor.last_run_local_date && monitor.last_run_local_date === parts.localDate) {
    return {
      due: false,
      reason: 'already_ran_today',
      timeZone,
      targetTime,
      frequency,
      localDate: parts.localDate
    };
  }

  if (frequency === 'weekly' && parts.weekday !== 'Mon') {
    return {
      due: false,
      reason: 'not_monday',
      timeZone,
      targetTime,
      frequency,
      localDate: parts.localDate
    };
  }

  if (frequency === 'monthly' && parts.day !== 1) {
    return {
      due: false,
      reason: 'not_first_of_month',
      timeZone,
      targetTime,
      frequency,
      localDate: parts.localDate
    };
  }

  const [hStr, mStr] = targetTime.split(':');
  const targetHour = parseInt(hStr, 10);
  const targetMin = parseInt(mStr, 10);
  const rawTargetMins = targetHour * 60 + targetMin;
  const effectiveTargetMins = Math.floor(rawTargetMins / 15) * 15;
  const currentMins = parts.hour * 60 + parts.minute;

  if (currentMins >= effectiveTargetMins && currentMins < effectiveTargetMins + 60) {
    return {
      due: true,
      reason: 'scheduled_window_matched',
      timeZone,
      targetTime,
      frequency,
      localDate: parts.localDate
    };
  }

  return {
    due: false,
    reason: currentMins < effectiveTargetMins ? 'before_scheduled_time' : 'window_passed',
    timeZone,
    targetTime,
    frequency,
    localDate: parts.localDate
  };
}

function daysInMonthUTC(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

export function formatYMD(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysUTC(year: number, month1Based: number, day: number, deltaDays: number): Date {
  return new Date(Date.UTC(year, month1Based - 1, day + deltaDays));
}

function subtractOneYearUTC(date: Date): Date {
  const targetYear = date.getUTCFullYear() - 1;
  const month1Based = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const maxDay = daysInMonthUTC(targetYear, month1Based);
  return new Date(Date.UTC(targetYear, month1Based - 1, Math.min(day, maxDay)));
}

export function resolveDateRanges(
  comparisonPeriod: string,
  timeZone = 'UTC',
  now = new Date()
): {
  currentRange: { startDate: string; endDate: string };
  previousRange: { startDate: string; endDate: string };
  label: string;
} {
  const { year, month, day } = getLocalDateParts(now, sanitizeTimezone(timeZone));
  const localTodayDate = addDaysUTC(year, month, day, 0);
  const yesterday = addDaysUTC(year, month, day, -1);
  const yY = yesterday.getUTCFullYear();
  const yM = yesterday.getUTCMonth() + 1;
  const yD = yesterday.getUTCDate();

  switch (comparisonPeriod) {
    case 'daily': {
      const prev = addDaysUTC(yY, yM, yD, -1);
      return {
        currentRange: { startDate: formatYMD(yesterday), endDate: formatYMD(yesterday) },
        previousRange: { startDate: formatYMD(prev), endDate: formatYMD(prev) },
        label: 'Day over Day (Yesterday vs 2 Days Ago)'
      };
    }

    case 'week_over_week':
    case 'last_7_vs_previous_7': {
      const curStart = addDaysUTC(yY, yM, yD, -6);
      const prevEnd = addDaysUTC(yY, yM, yD, -7);
      const prevStart = addDaysUTC(yY, yM, yD, -13);
      return {
        currentRange: { startDate: formatYMD(curStart), endDate: formatYMD(yesterday) },
        previousRange: { startDate: formatYMD(prevStart), endDate: formatYMD(prevEnd) },
        label: 'Week over Week (Last 7d vs Prior 7d)'
      };
    }

    case 'wow_calendar': {
      // Sun = 0, Mon = 1, ..., Sat = 6. If today is Mon (1), last completed Sun was -1 day. If Sun (0), last completed Sun was -7 days.
      const dow = localTodayDate.getUTCDay();
      const daysSinceLastSunday = dow === 0 ? 7 : dow;
      const lastSunday = addDaysUTC(year, month, day, -daysSinceLastSunday);
      const lastMonday = addDaysUTC(
        lastSunday.getUTCFullYear(),
        lastSunday.getUTCMonth() + 1,
        lastSunday.getUTCDate(),
        -6
      );
      const prevSunday = addDaysUTC(
        lastSunday.getUTCFullYear(),
        lastSunday.getUTCMonth() + 1,
        lastSunday.getUTCDate(),
        -7
      );
      const prevMonday = addDaysUTC(
        lastMonday.getUTCFullYear(),
        lastMonday.getUTCMonth() + 1,
        lastMonday.getUTCDate(),
        -7
      );
      return {
        currentRange: { startDate: formatYMD(lastMonday), endDate: formatYMD(lastSunday) },
        previousRange: { startDate: formatYMD(prevMonday), endDate: formatYMD(prevSunday) },
        label: 'Week over Week (Last Complete Week Mon–Sun)'
      };
    }

    case 'last_28_vs_previous_28': {
      const curStart = addDaysUTC(yY, yM, yD, -27);
      const prevEnd = addDaysUTC(yY, yM, yD, -28);
      const prevStart = addDaysUTC(yY, yM, yD, -55);
      return {
        currentRange: { startDate: formatYMD(curStart), endDate: formatYMD(yesterday) },
        previousRange: { startDate: formatYMD(prevStart), endDate: formatYMD(prevEnd) },
        label: 'Last 28 Days vs Previous 28 Days'
      };
    }

    case 'last_30_vs_previous_30':
    case 'monthly': {
      const curStart = addDaysUTC(yY, yM, yD, -29);
      const prevEnd = addDaysUTC(yY, yM, yD, -30);
      const prevStart = addDaysUTC(yY, yM, yD, -59);
      return {
        currentRange: { startDate: formatYMD(curStart), endDate: formatYMD(yesterday) },
        previousRange: { startDate: formatYMD(prevStart), endDate: formatYMD(prevEnd) },
        label: 'Month over Month (Rolling 30d vs Prior 30d)'
      };
    }

    case 'month_over_month': {
      const lastCompleteEnd = new Date(Date.UTC(year, month - 1, 0));
      const lastCompleteStart = new Date(Date.UTC(lastCompleteEnd.getUTCFullYear(), lastCompleteEnd.getUTCMonth(), 1));
      const prevCompleteEnd = new Date(Date.UTC(lastCompleteStart.getUTCFullYear(), lastCompleteStart.getUTCMonth(), 0));
      const prevCompleteStart = new Date(Date.UTC(prevCompleteEnd.getUTCFullYear(), prevCompleteEnd.getUTCMonth(), 1));
      return {
        currentRange: { startDate: formatYMD(lastCompleteStart), endDate: formatYMD(lastCompleteEnd) },
        previousRange: { startDate: formatYMD(prevCompleteStart), endDate: formatYMD(prevCompleteEnd) },
        label: 'Month over Month (Last Complete Calendar Month)'
      };
    }

    case 'year_over_year': {
      const curStart = addDaysUTC(yY, yM, yD, -6);
      const prevStart = subtractOneYearUTC(curStart);
      const prevEnd = subtractOneYearUTC(yesterday);
      return {
        currentRange: { startDate: formatYMD(curStart), endDate: formatYMD(yesterday) },
        previousRange: { startDate: formatYMD(prevStart), endDate: formatYMD(prevEnd) },
        label: 'Year over Year (Last 7 Days YoY)'
      };
    }

    case 'yoy_30_days': {
      const curStart = addDaysUTC(yY, yM, yD, -29);
      const prevStart = subtractOneYearUTC(curStart);
      const prevEnd = subtractOneYearUTC(yesterday);
      return {
        currentRange: { startDate: formatYMD(curStart), endDate: formatYMD(yesterday) },
        previousRange: { startDate: formatYMD(prevStart), endDate: formatYMD(prevEnd) },
        label: 'Year over Year (Last 30 Days YoY)'
      };
    }

    case 'yoy_month': {
      const lastCompleteEnd = new Date(Date.UTC(year, month - 1, 0));
      const lastCompleteStart = new Date(Date.UTC(lastCompleteEnd.getUTCFullYear(), lastCompleteEnd.getUTCMonth(), 1));
      const prevStart = subtractOneYearUTC(lastCompleteStart);
      const prevEnd = subtractOneYearUTC(lastCompleteEnd);
      return {
        currentRange: { startDate: formatYMD(lastCompleteStart), endDate: formatYMD(lastCompleteEnd) },
        previousRange: { startDate: formatYMD(prevStart), endDate: formatYMD(prevEnd) },
        label: 'Year over Year (Last Complete Month YoY)'
      };
    }

    case 'yearly': {
      const prevDay = subtractOneYearUTC(yesterday);
      return {
        currentRange: { startDate: formatYMD(yesterday), endDate: formatYMD(yesterday) },
        previousRange: { startDate: formatYMD(prevDay), endDate: formatYMD(prevDay) },
        label: 'Year over Year (Yesterday vs Same Date Last Year)'
      };
    }

    case 'yesterday_vs_last_week':
    case 'weekly':
    default: {
      const prev = addDaysUTC(yY, yM, yD, -7);
      return {
        currentRange: { startDate: formatYMD(yesterday), endDate: formatYMD(yesterday) },
        previousRange: { startDate: formatYMD(prev), endDate: formatYMD(prev) },
        label: 'Yesterday vs Same Day Last Week'
      };
    }
  }
}

export const RATE_METRICS = new Set(['bounceRate', 'engagementRate', 'sessionKeyEventRate']);
export const CURRENCY_METRICS = new Set(['totalRevenue']);
export const DURATION_METRICS = new Set(['averageSessionDuration']);
export const VALID_GA4_METRICS = new Set([
  'sessions',
  'activeUsers',
  'totalUsers',
  'newUsers',
  'keyEvents',
  'transactions',
  'totalRevenue',
  'ecommercePurchases',
  'sessionKeyEventRate',
  'screenPageViews',
  'eventCount',
  'bounceRate',
  'engagementRate',
  'averageSessionDuration'
]);

export function mapMetricName(m: string): string {
  return m === 'conversions' ? 'keyEvents' : m;
}

export function normalizeMetricValue(ga4MetricName: string, rawVal: number): number {
  const safeVal = Number.isFinite(rawVal) ? rawVal : 0;
  if (RATE_METRICS.has(ga4MetricName)) {
    return Number((safeVal * 100).toFixed(2));
  }
  return Number(safeVal.toFixed(2));
}

export function formatMetricValue(metric: string, val: number): string {
  const ga4Name = mapMetricName(metric);
  const safeVal = Number.isFinite(val) ? val : 0;
  if (RATE_METRICS.has(ga4Name)) {
    return `${safeVal.toFixed(1)}%`;
  }
  if (CURRENCY_METRICS.has(ga4Name)) {
    return `$${safeVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (DURATION_METRICS.has(ga4Name)) {
    return `${Math.round(safeVal)}s`;
  }
  return `${Math.round(safeVal).toLocaleString('en-US')}`;
}

export const GA4_CHANNEL_GROUPS = [
  'direct',
  'cross-network',
  'organic search',
  'paid search',
  'organic social',
  'paid social',
  'referral',
  'email',
  'affiliates',
  'display',
  'unassigned'
];

export function isChannelGroup(val: string): boolean {
  if (!val) return false;
  if (val === 'direct') return false;
  return GA4_CHANNEL_GROUPS.includes(val.trim().toLowerCase());
}

export function getFilterKey(c: { source?: string; medium?: string; device?: string }): string {
  const s = c.source && c.source !== 'all' && c.source !== 'All' ? c.source.trim().toLowerCase() : '';
  const m = c.medium && c.medium !== 'all' && c.medium !== 'All' ? c.medium.trim().toLowerCase() : '';
  const d = c.device && c.device !== 'all' && c.device !== 'All' ? c.device.trim().toLowerCase() : '';
  return `${s}:::${m}:::${d}`;
}

export function buildReportBody(
  dateRange: { startDate: string; endDate: string },
  metricNames: string[],
  source: string,
  medium: string,
  device = ''
) {
  const expressions: any[] = [];
  if (source) {
    const fieldName = isChannelGroup(source) ? 'sessionDefaultChannelGroup' : 'sessionSource';
    expressions.push({
      filter: {
        fieldName,
        stringFilter: {
          matchType: 'CONTAINS',
          value: source,
          caseSensitive: false
        }
      }
    });
  }
  if (medium) {
    expressions.push({
      filter: {
        fieldName: 'sessionMedium',
        stringFilter: {
          matchType: 'CONTAINS',
          value: medium,
          caseSensitive: false
        }
      }
    });
  }
  if (device) {
    expressions.push({
      filter: {
        fieldName: 'deviceCategory',
        stringFilter: {
          matchType: 'EXACT',
          value: device,
          caseSensitive: false
        }
      }
    });
  }

  const body: any = {
    dateRanges: [dateRange],
    metrics: metricNames.map(name => ({ name }))
  };

  if (expressions.length === 1) {
    body.dimensionFilter = expressions[0];
  } else if (expressions.length > 1) {
    body.dimensionFilter = {
      andGroup: { expressions }
    };
  }
  return body;
}

export function formatOperatorLabel(conditionType: string, threshold: number, metric?: string): string {
  const absT = Math.abs(Number.isFinite(threshold) ? threshold : 0);
  switch (conditionType) {
    case 'spikes_above':
      return `Spikes > +${absT}%`;
    case 'changes_by':
      return `Changes ±${absT}%`;
    case 'equals_zero':
      return 'Drops to Zero (= 0)';
    case 'falls_under_value':
      return `Falls Below ${formatMetricValue(metric || '', threshold)}`;
    case 'exceeds_value':
      return `Exceeds ${formatMetricValue(metric || '', threshold)}`;
    case 'drops_below':
    default:
      return `Drops < -${absT}%`;
  }
}

export function evaluateConditions(
  parsedConditions: MonitorConditionInput[],
  currentValLookup: Record<string, Record<string, number>>,
  pastValLookup: Record<string, Record<string, number>>,
  matchType: 'ALL' | 'ANY'
): { evaluatedConditions: EvaluatedCondition[]; isTriggered: boolean } {
  const evaluatedConditions: EvaluatedCondition[] = parsedConditions.map(cond => {
    const key = getFilterKey(cond);
    const ga4Name = mapMetricName(cond.metric);
    const currentVal = currentValLookup[key]?.[ga4Name] ?? 0;
    const pastVal = pastValLookup[key]?.[ga4Name] ?? 0;

    let percentChange = 0;
    if (pastVal > 0) {
      percentChange = ((currentVal - pastVal) / pastVal) * 100;
    } else if (currentVal > 0) {
      percentChange = 100;
    }

    const rawThreshold = Number(cond.thresholdPercentage ?? cond.threshold_percentage ?? 0);
    const safeRawThreshold = Number.isFinite(rawThreshold) ? rawThreshold : 0;
    const threshold = Math.abs(safeRawThreshold);
    let isTriggered = false;
    let actionText = '';
    const cType = cond.conditionType || cond.condition_type || 'drops_below';

    if (cType === 'drops_below' && percentChange <= -threshold) {
      isTriggered = true;
      actionText = 'dropped by';
    } else if (cType === 'spikes_above' && percentChange >= threshold) {
      isTriggered = true;
      actionText = 'spiked by';
    } else if (cType === 'changes_by' && Math.abs(percentChange) >= threshold) {
      isTriggered = true;
      actionText = percentChange > 0 ? 'increased by' : 'decreased by';
    } else if (cType === 'equals_zero' && currentVal === 0) {
      isTriggered = true;
      actionText = 'dropped to zero';
    } else if (cType === 'falls_under_value' && currentVal < safeRawThreshold) {
      isTriggered = true;
      actionText = 'fell below threshold';
    } else if (cType === 'exceeds_value' && currentVal > safeRawThreshold) {
      isTriggered = true;
      actionText = 'exceeded threshold';
    }

    const sLabel = cond.source && cond.source !== 'all' && cond.source !== 'All' ? cond.source : 'All';
    const mLabel = cond.medium && cond.medium !== 'all' && cond.medium !== 'All' ? cond.medium : 'All';
    const dLabel = cond.device && cond.device !== 'all' && cond.device !== 'All' ? cond.device : 'All';

    return {
      metric: cond.metric,
      source: sLabel,
      medium: mLabel,
      device: dLabel,
      conditionType: cType,
      thresholdPercentage: cType === 'equals_zero' ? 0 : safeRawThreshold,
      currentVal,
      pastVal,
      formattedCurrent: formatMetricValue(cond.metric, currentVal),
      formattedPast: formatMetricValue(cond.metric, pastVal),
      percentChange,
      isTriggered,
      actionText,
      operatorLabel: formatOperatorLabel(cType, safeRawThreshold, cond.metric)
    };
  });

  const isTriggered = matchType === 'ALL'
    ? evaluatedConditions.every(c => c.isTriggered)
    : evaluatedConditions.some(c => c.isTriggered);

  return { evaluatedConditions, isTriggered };
}

export function formatCleanPropertyName(rawName?: string): string {
  if (!rawName) return 'GA4 Property';
  let name = rawName.trim();
  if (name.includes(' > ')) {
    const parts = name.split(' > ').map(s => s.trim());
    const account = parts[0];
    const prop = parts[1] || '';
    const cleanProp = prop
      .replace(/\/\s*GA4\b.*/i, '')
      .replace(/-\s*GA4\b.*/i, '')
      .replace(/\bGA4\s*-\s*MonsterInsights\b/i, '')
      .replace(/\bMonsterInsights\b/i, '')
      .replace(/\bGA4\b/i, '')
      .replace(/\/+$/, '')
      .trim();
    if (account.toLowerCase() === cleanProp.toLowerCase() || !cleanProp) {
      name = account;
    } else if (cleanProp.includes('.') && !account.includes('.')) {
      name = account;
    } else {
      name = account || cleanProp;
    }
  } else if (name.includes('>')) {
    name = name.split('>')[0].trim();
  }
  return name
    .replace(/\/\s*GA4\b.*/i, '')
    .replace(/-\s*GA4\b.*/i, '')
    .replace(/\bGA4\s*-\s*MonsterInsights\b/i, '')
    .replace(/\bMonsterInsights\b/i, '')
    .replace(/\bGA4\b/i, '')
    .replace(/\/+$/, '')
    .trim() || rawName;
}
