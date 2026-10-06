import { getGoogleAccessToken } from '../gtm/_utils';

export async function onRequestGet(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const propertyId = url.searchParams.get('propertyId');

  if (!propertyId) {
    return new Response(JSON.stringify({ error: 'Missing propertyId' }), { status: 400 });
  }

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
          { name: 'conversions' },
          { name: 'totalRevenue' }
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }]
      })
    });

    const dailyData = await dailyReportRes.json();

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
          { name: 'conversions' },
          { name: 'totalRevenue' }
        ]
      })
    });

    const summaryData = await summaryReportRes.json();

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
      const dateStr = row.dimensionValues[0].value;
      const formattedDate = `${dateStr.substring(4, 6)}/${dateStr.substring(6, 8)}`;
      
      return {
        date: formattedDate,
        sessions: parseInt(row.metricValues[0].value, 10),
        conversions: parseInt(row.metricValues[1].value, 10),
        revenue: parseFloat(row.metricValues[2].value)
      };
    });

    const topEvents = (eventsData.rows || []).map((row: any) => ({
      name: row.dimensionValues[0].value,
      count: parseInt(row.metricValues[0].value, 10)
    }));

    const summary = summaryData.rows?.[0]?.metricValues || [{value: 0}, {value: 0}, {value: 0}, {value: 0}];

    return new Response(JSON.stringify({ 
      chartData,
      topEvents,
      summary: {
        sessions: parseInt(summary[0].value, 10),
        activeUsers: parseInt(summary[1].value, 10),
        conversions: parseInt(summary[2].value, 10),
        revenue: parseFloat(summary[3].value)
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
