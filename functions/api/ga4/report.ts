import { getGoogleAccessToken } from '../gtm/_utils';

export async function onRequestGet(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const propertyIdParam = url.searchParams.get('propertyId');

  if (!propertyIdParam) {
    return new Response(JSON.stringify({ error: 'Missing propertyId' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Ensure format is properties/{id}
  const propertyId = propertyIdParam.startsWith('properties/')
    ? propertyIdParam
    : `properties/${propertyIdParam}`;

  try {
    const accessToken = await getGoogleAccessToken(env, request);

    // Fetch last 30 days of daily data
    const dailyReportRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'keyEvents' }, // Google deprecated 'conversions' in favor of 'keyEvents'
          { name: 'totalRevenue' }
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }]
      })
    });

    const dailyData = await dailyReportRes.json();
    if (!dailyReportRes.ok) {
      return new Response(JSON.stringify({ 
        error: dailyData.error?.message || `Failed to fetch daily GA4 data (${dailyReportRes.status})` 
      }), { status: dailyReportRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    // Fetch summary metrics (totals)
    const summaryReportRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'keyEvents' }, // Google deprecated 'conversions'
          { name: 'totalRevenue' }
        ]
      })
    });

    const summaryData = await summaryReportRes.json();
    if (!summaryReportRes.ok) {
      return new Response(JSON.stringify({ 
        error: summaryData.error?.message || `Failed to fetch GA4 summary (${summaryReportRes.status})` 
      }), { status: summaryReportRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    // Fetch top events
    const eventsReportRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 10
      })
    });

    const eventsData = await eventsReportRes.json();

    // Format data for Recharts
    const chartData = (dailyData.rows || []).map((row: any) => {
      // Date comes as YYYYMMDD
      const dateStr = row.dimensionValues?.[0]?.value || '';
      const formattedDate = dateStr.length === 8 
        ? `${dateStr.substring(4, 6)}/${dateStr.substring(6, 8)}`
        : dateStr;
      
      return {
        date: formattedDate,
        sessions: parseInt(row.metricValues?.[0]?.value || '0', 10),
        conversions: parseInt(row.metricValues?.[1]?.value || '0', 10), // mapped from keyEvents
        revenue: parseFloat(row.metricValues?.[2]?.value || '0')
      };
    });

    const topEvents = (eventsData.rows || []).map((row: any) => ({
      name: row.dimensionValues?.[0]?.value || 'unknown',
      count: parseInt(row.metricValues?.[0]?.value || '0', 10)
    }));

    const summary = summaryData.rows?.[0]?.metricValues || [{value: '0'}, {value: '0'}, {value: '0'}, {value: '0'}];

    return new Response(JSON.stringify({ 
      chartData,
      topEvents,
      summary: {
        sessions: parseInt(summary[0]?.value || '0', 10),
        activeUsers: parseInt(summary[1]?.value || '0', 10),
        conversions: parseInt(summary[2]?.value || '0', 10),
        revenue: parseFloat(summary[3]?.value || '0')
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
