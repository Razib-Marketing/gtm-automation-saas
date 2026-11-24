import { getGoogleAccessToken, extractClerkUserId } from '../gtm/_utils';
import { ensureProjectsSchema } from './_shared';
import {
  analyzeGa4AuditSnapshot,
  buildDemoGa4Snapshot,
  Ga4AuditRawSnapshot
} from './_auditEngine';

async function ensureGa4AuditLogsSchema(db: any) {
  await ensureProjectsSchema(db);
}

async function fetchJsonSafe(
  url: string,
  headers: Record<string, string>,
  label: string,
  apiAccessNotes: string[]
): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const res = await fetch(url, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || res.statusText || `HTTP ${res.status}`;
      apiAccessNotes.push(`${label}: HTTP ${res.status} (${msg})`);
      return { ok: false, status: res.status, data };
    }
    return { ok: true, status: res.status, data };
  } catch (err: any) {
    apiAccessNotes.push(`${label}: Network error (${err.message})`);
    return { ok: false, status: 500, data: null };
  }
}

async function runGa4ReportSafe(
  propertyId: string,
  accessToken: string,
  body: any,
  label: string,
  apiAccessNotes: string[]
): Promise<any | null> {
  try {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || res.statusText || `HTTP ${res.status}`;
      apiAccessNotes.push(`${label}: HTTP ${res.status} (${msg})`);
      return null;
    }
    return data;
  } catch (err: any) {
    apiAccessNotes.push(`${label}: Network error (${err.message})`);
    return null;
  }
}

export async function onRequest(context: any) {
  const { env, request } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const isDemo = url.searchParams.get('demo') === 'true';
  const isHistory = url.searchParams.get('history') === 'true';
  const rawPropertyId = url.searchParams.get('propertyId');
  const filterProjectId = url.searchParams.get('projectId') || '';

  // 1. Demo Mode (no Google OAuth required — great for local & instant previews)
  if (isDemo) {
    const report = analyzeGa4AuditSnapshot(buildDemoGa4Snapshot());
    return new Response(JSON.stringify({ ...report, isDemo: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Audit History Mode
  if (isHistory) {
    try {
      const clerkUserId = extractClerkUserId(request);
      if (!env.DB) {
        return new Response(JSON.stringify({ logs: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      await ensureGa4AuditLogsSchema(env.DB);
      const normPropFilter = rawPropertyId
        ? (rawPropertyId.startsWith('properties/') ? rawPropertyId : `properties/${rawPropertyId}`)
        : '';

      let results: any[] = [];
      if (filterProjectId) {
        const res = await env.DB.prepare(
          `SELECT id, project_id, property_id, property_name, health_score, critical_count, warning_count, passed_count, raw_data, created_at
           FROM ga4_audit_logs
           WHERE user_id = ? AND (project_id = ? OR (project_id IS NULL AND ? != '' AND property_id = ?))
           ORDER BY created_at DESC
           LIMIT 25`
        ).bind(clerkUserId, filterProjectId, normPropFilter, normPropFilter).all();
        results = res.results || [];
      } else {
        const res = await env.DB.prepare(
          `SELECT id, project_id, property_id, property_name, health_score, critical_count, warning_count, passed_count, raw_data, created_at
           FROM ga4_audit_logs
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT 25`
        ).bind(clerkUserId).all();
        results = res.results || [];
      }

      const logs = results.map((row: any) => {
        let parsed = null;
        try {
          parsed = JSON.parse(row.raw_data);
        } catch (_) {}
        return {
          id: row.id,
          projectId: row.project_id || null,
          propertyId: row.property_id,
          propertyName: row.property_name,
          healthScore: row.health_score,
          criticalCount: row.critical_count,
          warningCount: row.warning_count,
          passedCount: row.passed_count,
          report: parsed,
          createdAt: row.created_at
        };
      });

      return new Response(JSON.stringify({ logs }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e: any) {
      const status = e.message?.includes('Authorization') || e.message?.includes('token') ? 401 : 500;
      return new Response(JSON.stringify({ error: e.message }), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 3. Live Property Audit Mode
  if (!rawPropertyId) {
    return new Response(JSON.stringify({ error: 'Missing propertyId parameter (expected properties/XXXX or ?demo=true)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const propertyId = rawPropertyId.startsWith('properties/')
    ? rawPropertyId
    : `properties/${rawPropertyId}`;

  try {
    const clerkUserId = extractClerkUserId(request);
    const accessToken = await getGoogleAccessToken(env, request);
    const headers = { 'Authorization': `Bearer ${accessToken}` };
    const apiAccessNotes: string[] = [];

    // Fetch property metadata first (required)
    const propRes = await fetchJsonSafe(
      `https://analyticsadmin.googleapis.com/v1beta/${propertyId}`,
      headers,
      'Property Metadata',
      apiAccessNotes
    );
    if (!propRes.ok) {
      return new Response(JSON.stringify({
        error: propRes.data?.error?.message || `Unable to access GA4 property ${propertyId} (${propRes.status})`
      }), { status: propRes.status || 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Batch 1: Parallel Admin API property configuration & link checks
    const [
      streamsRes,
      retentionRes,
      keyEventsRes,
      customDimsRes,
      customMetricsRes,
      adsLinksRes,
      gscLinksRes,
      bqLinksRes,
      signalsRes,
      attributionRes,
      dv360Res,
      sa360Res,
      adSenseRes
    ] = await Promise.all([
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1beta/${propertyId}/dataStreams`, headers, 'Data Streams', apiAccessNotes),
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1beta/${propertyId}/dataRetentionSettings`, headers, 'Data Retention', apiAccessNotes),
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1beta/${propertyId}/keyEvents?pageSize=200`, headers, 'Key Events', apiAccessNotes),
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1beta/${propertyId}/customDimensions?pageSize=200`, headers, 'Custom Dimensions', apiAccessNotes),
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1beta/${propertyId}/customMetrics?pageSize=200`, headers, 'Custom Metrics', apiAccessNotes),
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1beta/${propertyId}/googleAdsLinks?pageSize=200`, headers, 'Google Ads Links', apiAccessNotes),
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1alpha/${propertyId}/searchConsoleLinks?pageSize=50`, headers, 'Search Console Links', apiAccessNotes),
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1alpha/${propertyId}/bigQueryLinks?pageSize=50`, headers, 'BigQuery Links', apiAccessNotes),
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1alpha/${propertyId}/googleSignalsSettings`, headers, 'Google Signals', apiAccessNotes),
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1alpha/${propertyId}/attributionSettings`, headers, 'Attribution Settings', apiAccessNotes),
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1alpha/${propertyId}/displayVideo360AdvertiserLinks?pageSize=50`, headers, 'DV360 Links', apiAccessNotes),
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1alpha/${propertyId}/searchAds360Links?pageSize=50`, headers, 'SA360 Links', apiAccessNotes),
      fetchJsonSafe(`https://analyticsadmin.googleapis.com/v1alpha/${propertyId}/adSenseLinks?pageSize=50`, headers, 'AdSense Links', apiAccessNotes)
    ]);

    // Fallback to legacy conversionEvents if keyEvents endpoint returned 404
    let rawKeyEvents: any[] | null = keyEventsRes.ok ? (keyEventsRes.data?.keyEvents || []) : null;
    if (!keyEventsRes.ok && keyEventsRes.status === 404) {
      const convRes = await fetchJsonSafe(
        `https://analyticsadmin.googleapis.com/v1beta/${propertyId}/conversionEvents?pageSize=200`,
        headers,
        'Conversion Events (Legacy)',
        apiAccessNotes
      );
      if (convRes.ok) {
        rawKeyEvents = convRes.data?.conversionEvents || [];
      }
    }

    const rawStreams: any[] = streamsRes.ok ? (streamsRes.data?.dataStreams || []) : [];
    const normalizedStreams = rawStreams.map(s => ({
      name: s.name,
      displayName: s.displayName,
      type: s.type,
      measurementId: s.webStreamData?.measurementId || '',
      defaultUri: s.webStreamData?.defaultUri || ''
    }));
    const primaryWebStream = normalizedStreams.find(s => s.type === 'WEB_DATA_STREAM' || Boolean(s.measurementId)) || normalizedStreams[0];

    // Batch 2 & 3: Stream-specific settings + 30-day Data API forensics (parallel!)
    const [
      enhancedRes,
      mpSecretsRes,
      totalsCoreReport,
      totalsRatesReport,
      channelsReport,
      referralsReport,
      hostnamesReport,
      eventsReport,
      pagesReport,
      landingReport
    ] = await Promise.all([
      primaryWebStream?.name
        ? fetchJsonSafe(
            `https://analyticsadmin.googleapis.com/v1alpha/${primaryWebStream.name}/enhancedMeasurementSettings`,
            headers,
            'Enhanced Measurement',
            apiAccessNotes
          )
        : Promise.resolve({ ok: false, status: 404, data: null }),
      primaryWebStream?.name
        ? fetchJsonSafe(
            `https://analyticsadmin.googleapis.com/v1beta/${primaryWebStream.name}/measurementProtocolSecrets`,
            headers,
            'Measurement Protocol Secrets',
            apiAccessNotes
          )
        : Promise.resolve({ ok: false, status: 404, data: null }),
      // Note: GA4 Data API caps each runReport call at 10 metrics max, so totals are split into 8 + 3
      runGa4ReportSafe(
        propertyId,
        accessToken,
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'totalUsers' },
            { name: 'eventCount' },
            { name: 'screenPageViews' },
            { name: 'keyEvents' },
            { name: 'transactions' },
            { name: 'totalRevenue' }
          ]
        },
        '30d Totals Core',
        apiAccessNotes
      ),
      runGa4ReportSafe(
        propertyId,
        accessToken,
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
          metrics: [
            { name: 'bounceRate' },
            { name: 'engagementRate' },
            { name: 'averageSessionDuration' }
          ]
        },
        '30d Totals Rates',
        apiAccessNotes
      ),
      runGa4ReportSafe(
        propertyId,
        accessToken,
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }, { name: 'keyEvents' }, { name: 'totalRevenue' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 25
        },
        '30d Channels',
        apiAccessNotes
      ),
      runGa4ReportSafe(
        propertyId,
        accessToken,
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
          dimensionFilter: {
            filter: {
              fieldName: 'sessionMedium',
              stringFilter: { matchType: 'EXACT', value: 'referral', caseSensitive: false }
            }
          },
          metrics: [
            { name: 'sessions' },
            { name: 'keyEvents' },
            { name: 'transactions' },
            { name: 'totalRevenue' }
          ],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 50
        },
        '30d Referrals',
        apiAccessNotes
      ),
      runGa4ReportSafe(
        propertyId,
        accessToken,
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'hostName' }],
          metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 30
        },
        '30d Hostnames',
        apiAccessNotes
      ),
      runGa4ReportSafe(
        propertyId,
        accessToken,
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 60
        },
        '30d Events',
        apiAccessNotes
      ),
      runGa4ReportSafe(
        propertyId,
        accessToken,
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'pagePathPlusQueryString' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 100
        },
        '30d Pages',
        apiAccessNotes
      ),
      runGa4ReportSafe(
        propertyId,
        accessToken,
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
          dimensions: [{ name: 'landingPagePlusQueryString' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 30
        },
        '30d Landing Pages',
        apiAccessNotes
      )
    ]);

    const coreRow = totalsCoreReport?.rows?.[0]?.metricValues || [];
    const ratesRow = totalsRatesReport?.rows?.[0]?.metricValues || [];
    const metricNum = (arr: any[], idx: number) => parseFloat(arr[idx]?.value || '0') || 0;

    const snapshot: Ga4AuditRawSnapshot = {
      property: {
        name: propRes.data?.name || propertyId,
        displayName: propRes.data?.displayName || propertyId,
        timeZone: propRes.data?.timeZone,
        currencyCode: propRes.data?.currencyCode,
        industryCategory: propRes.data?.industryCategory,
        createTime: propRes.data?.createTime
      },
      dataStreams: normalizedStreams,
      dataRetention: retentionRes.ok ? retentionRes.data : null,
      enhancedMeasurement: enhancedRes.ok ? enhancedRes.data : null,
      googleSignals: signalsRes.ok ? signalsRes.data : null,
      attribution: attributionRes.ok ? attributionRes.data : null,
      links: {
        googleAds: adsLinksRes.ok ? (adsLinksRes.data?.googleAdsLinks || []) : null,
        searchConsole: gscLinksRes.ok ? (gscLinksRes.data?.searchConsoleLinks || []) : null,
        bigQuery: bqLinksRes.ok ? (bqLinksRes.data?.bigQueryLinks || []) : null,
        dv360: dv360Res.ok ? (dv360Res.data?.displayVideo360AdvertiserLinks || []) : null,
        sa360: sa360Res.ok ? (sa360Res.data?.searchAds360Links || []) : null,
        adSense: adSenseRes.ok ? (adSenseRes.data?.adSenseLinks || []) : null,
        measurementProtocolSecretsCount: mpSecretsRes.ok
          ? (mpSecretsRes.data?.measurementProtocolSecrets || []).length
          : null
      },
      keyEvents: rawKeyEvents
        ? rawKeyEvents.map((ke: any) => ({
            eventName: ke.eventName || '',
            countingMethod: ke.countingMethod || 'ONCE_PER_EVENT'
          }))
        : null,
      customDimensions: customDimsRes.ok
        ? (customDimsRes.data?.customDimensions || []).map((d: any) => ({
            parameterName: d.parameterName,
            displayName: d.displayName,
            scope: d.scope
          }))
        : null,
      customMetrics: customMetricsRes.ok
        ? (customMetricsRes.data?.customMetrics || []).map((m: any) => ({
            parameterName: m.parameterName,
            displayName: m.displayName
          }))
        : null,
      telemetry30d: {
        totals: {
          sessions: metricNum(coreRow, 0),
          activeUsers: metricNum(coreRow, 1),
          totalUsers: metricNum(coreRow, 2),
          eventCount: metricNum(coreRow, 3),
          screenPageViews: metricNum(coreRow, 4),
          keyEvents: metricNum(coreRow, 5),
          transactions: metricNum(coreRow, 6),
          totalRevenue: metricNum(coreRow, 7),
          bounceRate: metricNum(ratesRow, 0),
          engagementRate: metricNum(ratesRow, 1),
          averageSessionDuration: metricNum(ratesRow, 2)
        },
        channels: (channelsReport?.rows || []).map((r: any) => ({
          channel: r.dimensionValues?.[0]?.value || 'Unknown',
          sessions: parseFloat(r.metricValues?.[0]?.value || '0') || 0,
          keyEvents: parseFloat(r.metricValues?.[1]?.value || '0') || 0,
          revenue: parseFloat(r.metricValues?.[2]?.value || '0') || 0
        })),
        referrals: (referralsReport?.rows || []).map((r: any) => ({
          source: r.dimensionValues?.[0]?.value || '',
          medium: r.dimensionValues?.[1]?.value || 'referral',
          sessions: parseFloat(r.metricValues?.[0]?.value || '0') || 0,
          keyEvents: parseFloat(r.metricValues?.[1]?.value || '0') || 0,
          transactions: parseFloat(r.metricValues?.[2]?.value || '0') || 0,
          revenue: parseFloat(r.metricValues?.[3]?.value || '0') || 0
        })),
        hostnames: (hostnamesReport?.rows || []).map((r: any) => ({
          hostName: r.dimensionValues?.[0]?.value || '(not set)',
          sessions: parseFloat(r.metricValues?.[0]?.value || '0') || 0,
          screenPageViews: parseFloat(r.metricValues?.[1]?.value || '0') || 0
        })),
        events: (eventsReport?.rows || []).map((r: any) => ({
          eventName: r.dimensionValues?.[0]?.value || '',
          eventCount: parseFloat(r.metricValues?.[0]?.value || '0') || 0,
          totalUsers: parseFloat(r.metricValues?.[1]?.value || '0') || 0
        })),
        pages: (pagesReport?.rows || []).map((r: any) => ({
          pagePathPlusQueryString: r.dimensionValues?.[0]?.value || '/',
          screenPageViews: parseFloat(r.metricValues?.[0]?.value || '0') || 0
        })),
        landingPages: (landingReport?.rows || []).map((r: any) => ({
          landingPage: r.dimensionValues?.[0]?.value || '(not set)',
          sessions: parseFloat(r.metricValues?.[0]?.value || '0') || 0
        }))
      },
      apiAccessNotes
    };

    const report = analyzeGa4AuditSnapshot(snapshot);
    let savedAuditId: string | null = null;

    if (env.DB) {
      try {
        await ensureGa4AuditLogsSchema(env.DB);
        savedAuditId = 'ga4_aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        await env.DB.prepare(
          `INSERT INTO ga4_audit_logs (id, user_id, project_id, property_id, property_name, health_score, critical_count, warning_count, passed_count, raw_data)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          savedAuditId,
          clerkUserId,
          filterProjectId || null,
          report.propertyMeta.propertyId,
          report.propertyMeta.displayName,
          report.healthScore,
          report.summary.criticalCount,
          report.summary.warningCount,
          report.summary.passedCount,
          JSON.stringify(report)
        ).run();
      } catch (_) {}
    }

    return new Response(JSON.stringify({ ...report, savedAuditId, isDemo: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    const msg = e.message || 'Failed to audit GA4 property';
    const status = msg.includes('Authorization') || msg.includes('token') || msg.includes('not connected')
      ? 401
      : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
