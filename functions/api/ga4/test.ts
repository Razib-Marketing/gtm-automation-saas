export async function onRequest(context: any) {
  const { env, request } = context;

  // Verify Auth
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { monitorId } = await request.json();
    if (!monitorId) return new Response(JSON.stringify({ error: 'Missing monitorId' }), { status: 400 });

    const monitor = await env.DB.prepare(
      "SELECT * FROM ga4_monitors WHERE id = ?"
    ).bind(monitorId).first();

    if (!monitor) return new Response(JSON.stringify({ error: 'Monitor not found' }), { status: 404 });

    // 1. Get User's Refresh Token
    const userConn = await env.DB.prepare(
      "SELECT encrypted_refresh_token FROM gtm_connections WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(monitor.user_id).first();

    if (!userConn) return new Response(JSON.stringify({ error: 'Google connection not found' }), { status: 400 });

    // 2. Exchange for Access Token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: userConn.encrypted_refresh_token,
        grant_type: 'refresh_token'
      })
    });
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) return new Response(JSON.stringify({ error: 'Failed to refresh Google token' }), { status: 400 });

    // 3. Query GA4 Data API
    let dateRanges = [
      { startDate: 'yesterday', endDate: 'yesterday' },
      { startDate: '2daysAgo', endDate: '2daysAgo' }
    ];

    switch (monitor.comparison_period) {
      case 'yesterday_vs_last_week':
        dateRanges = [
          { startDate: 'yesterday', endDate: 'yesterday' },
          { startDate: '8daysAgo', endDate: '8daysAgo' }
        ];
        break;
      case 'last_7_vs_previous_7':
        dateRanges = [
          { startDate: '7daysAgo', endDate: 'yesterday' },
          { startDate: '14daysAgo', endDate: '8daysAgo' }
        ];
        break;
      case 'last_28_vs_previous_28':
        dateRanges = [
          { startDate: '28daysAgo', endDate: 'yesterday' },
          { startDate: '56daysAgo', endDate: '29daysAgo' }
        ];
        break;
      case 'last_30_vs_previous_30':
        dateRanges = [
          { startDate: '30daysAgo', endDate: 'yesterday' },
          { startDate: '60daysAgo', endDate: '31daysAgo' }
        ];
        break;
    }

    const reportRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/${monitor.property_id}:runReport`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: dateRanges,
        metrics: [{ name: monitor.metric }]
      })
    });

    const report = await reportRes.json();

    if (!report.rows || report.rows.length < 2) {
      return new Response(JSON.stringify({ error: 'Not enough data in GA4 to compare' }), { status: 400 });
    }

    const currentVal = parseFloat(report.rows[0].metricValues[0].value);
    const pastVal = parseFloat(report.rows[1].metricValues[0].value);
    let percentChange = 0;

    if (pastVal > 0) {
      percentChange = ((currentVal - pastVal) / pastVal) * 100;
    } else if (currentVal > 0) {
      percentChange = 100; // went from 0 to something
    }

    let isTriggered = false;
    let actionText = '';
    const color = percentChange > 0 ? '#10B981' : '#EF4444'; // Green if up, Red if down
    
    if (monitor.condition_type === 'drops_below' && percentChange <= -Math.abs(monitor.threshold_percentage)) {
        isTriggered = true;
        actionText = 'dropped by';
    } else if (monitor.condition_type === 'spikes_above' && percentChange >= Math.abs(monitor.threshold_percentage)) {
        isTriggered = true;
        actionText = 'spiked by';
    } else if (monitor.condition_type === 'changes_by' && Math.abs(percentChange) >= Math.abs(monitor.threshold_percentage)) {
        isTriggered = true;
        actionText = percentChange > 0 ? 'increased by' : 'decreased by';
    }

    // Build Email HTML
    const statusHeader = isTriggered 
      ? `<div style="background-color: ${color}; color: white; padding: 20px; text-align: center;"><h2>🚨 GA4 Anomaly Detected</h2></div>`
      : `<div style="background-color: #3B82F6; color: white; padding: 20px; text-align: center;"><h2>✅ GA4 Monitor Health Check</h2></div>`;

    const statusMessage = isTriggered
      ? `<p>Your Observer monitor for <strong>${monitor.property_name}</strong> has detected significant movement.</p>`
      : `<p>You requested a manual test of your Observer monitor for <strong>${monitor.property_name}</strong>. Everything is running smoothly and no anomalies were detected at this time.</p>`;

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        ${statusHeader}
        <div style="padding: 20px;">
          ${statusMessage}
          <div style="background: #F3F4F6; padding: 15px; border-radius: 6px; margin-top: 20px;">
            <table style="width: 100%; text-align: left;">
              <tr><th style="padding-bottom: 8px;">Metric:</th><td style="padding-bottom: 8px;">${monitor.metric}</td></tr>
              <tr><th style="padding-bottom: 8px;">Evaluation:</th><td style="padding-bottom: 8px;">${monitor.comparison_period.replace(/_/g, ' ')}</td></tr>
              <tr><th style="padding-bottom: 8px;">Current Window:</th><td style="padding-bottom: 8px;"><strong>${currentVal}</strong></td></tr>
              <tr><th style="padding-bottom: 8px;">Previous Window:</th><td style="padding-bottom: 8px;"><strong>${pastVal}</strong></td></tr>
              <tr><th>Change:</th><td><strong style="color: ${color}">${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%</strong></td></tr>
            </table>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #6B7280; text-align: center;">
            This is an automated message from GTM & Analytics Automation SaaS.
          </p>
        </div>
      </div>
    `;

    if (env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Observer <onboarding@resend.dev>',
          to: monitor.alert_email,
          subject: isTriggered 
            ? `🚨 GA4 Alert: ${monitor.property_name} ${actionText} ${Math.abs(percentChange).toFixed(1)}%`
            : `✅ Health Check: ${monitor.property_name} is stable (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%)`,
          html: htmlBody
        })
      });
    }

    return new Response(JSON.stringify({ success: true, isTriggered, percentChange }), { status: 200 });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
