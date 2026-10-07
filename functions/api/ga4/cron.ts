export async function onRequestGet(context: any) {
  const { env, request } = context;

  // Extremely basic security for the cron endpoint
  const auth = new URL(request.url).searchParams.get('token');
  if (auth !== env.CRON_SECRET && env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { results: monitors } = await env.DB.prepare(
      "SELECT * FROM ga4_monitors WHERE status = 'active'"
    ).all();

    const logs = [];

    for (const monitor of monitors) {
      try {
        // 1. Get User's Refresh Token
        const userConn = await env.DB.prepare(
          "SELECT encrypted_refresh_token FROM gtm_connections WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
        ).bind(monitor.user_id).first();

        if (!userConn) continue;

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
        if (!accessToken) continue;

        // 3. Configure Date Windows
        let currentRange = { startDate: 'yesterday', endDate: 'yesterday' };
        let previousRange = { startDate: '2daysAgo', endDate: '2daysAgo' };

        switch (monitor.comparison_period) {
          case 'yesterday_vs_last_week':
          case 'weekly':
            currentRange = { startDate: 'yesterday', endDate: 'yesterday' };
            previousRange = { startDate: '8daysAgo', endDate: '8daysAgo' };
            break;
          case 'last_7_vs_previous_7':
            currentRange = { startDate: '7daysAgo', endDate: 'yesterday' };
            previousRange = { startDate: '14daysAgo', endDate: '8daysAgo' };
            break;
          case 'last_28_vs_previous_28':
            currentRange = { startDate: '28daysAgo', endDate: 'yesterday' };
            previousRange = { startDate: '56daysAgo', endDate: '29daysAgo' };
            break;
          case 'last_30_vs_previous_30':
          case 'monthly':
            currentRange = { startDate: '30daysAgo', endDate: 'yesterday' };
            previousRange = { startDate: '60daysAgo', endDate: '31daysAgo' };
            break;
          case 'yearly':
            currentRange = { startDate: 'yesterday', endDate: 'yesterday' };
            previousRange = { startDate: '365daysAgo', endDate: '365daysAgo' };
            break;
          case 'daily':
          default:
            currentRange = { startDate: 'yesterday', endDate: 'yesterday' };
            previousRange = { startDate: '2daysAgo', endDate: '2daysAgo' };
            break;
        }

        const metricName = monitor.metric === 'conversions' ? 'keyEvents' : monitor.metric;
        const propertyId = monitor.property_id.startsWith('properties/')
          ? monitor.property_id
          : `properties/${monitor.property_id}`;

        // Query Current Window
        const currentRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dateRanges: [currentRange],
            metrics: [{ name: metricName }]
          })
        });

        const currentReport = await currentRes.json();
        if (!currentRes.ok) continue;

        // Query Previous Window
        const prevRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dateRanges: [previousRange],
            metrics: [{ name: metricName }]
          })
        });

        const prevReport = await prevRes.json();
        if (!prevRes.ok) continue;

        const currentVal = parseFloat(currentReport.rows?.[0]?.metricValues?.[0]?.value || '0');
        const pastVal = parseFloat(prevReport.rows?.[0]?.metricValues?.[0]?.value || '0');

        let percentChange = 0;
        if (pastVal > 0) {
          percentChange = ((currentVal - pastVal) / pastVal) * 100;
        } else if (currentVal > 0) {
          percentChange = 100;
        }

        let isTriggered = false;
        let actionText = '';
        
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

            if (isTriggered) {
              
            const color = percentChange > 0 ? '#10B981' : '#EF4444';
            const htmlBody = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div style="background-color: ${color}; color: white; padding: 20px; text-align: center;"><h2>🚨 GA4 Anomaly Detected</h2></div>
                <div style="padding: 20px;">
                  <p>Your Observer monitor for <strong>${monitor.property_name}</strong> has detected significant movement.</p>
                  <div style="background: #F3F4F6; padding: 15px; border-radius: 6px; margin-top: 20px;">
                    <table style="width: 100%; text-align: left;">
                      <tr><th style="padding-bottom: 8px;">Metric:</th><td style="padding-bottom: 8px;">${monitor.metric}</td></tr>
                      <tr><th style="padding-bottom: 8px;">Evaluation:</th><td style="padding-bottom: 8px;">${monitor.comparison_period.replace(/_/g, ' ')}</td></tr>
                      <tr><th style="padding-bottom: 8px;">Current Window:</th><td style="padding-bottom: 8px;"><strong>${currentVal}</strong></td></tr>
                      <tr><th style="padding-bottom: 8px;">Previous Window:</th><td style="padding-bottom: 8px;"><strong>${pastVal}</strong></td></tr>
                      <tr><th>Change:</th><td><strong style="color: ${color}">${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%</strong></td></tr>
                    </table>
                  </div>
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
                    subject: `🚨 GA4 Alert: ${monitor.property_name} (${monitor.metric}) ${actionText} ${Math.abs(percentChange).toFixed(1)}%`,
                    html: htmlBody
                  })
                });
            }
            logs.push(`Alerted ${monitor.alert_email} for ${monitor.property_name} (${actionText} ${percentChange.toFixed(1)}%)`);
              
              // Log to Database
              const alertId = 'alt_' + Date.now() + Math.random().toString(36).substring(2, 9);
              await env.DB.prepare(
                "INSERT INTO ga4_alerts (id, monitor_id, user_id, property_name, metric, condition_type, percent_change) VALUES (?, ?, ?, ?, ?, ?, ?)"
              ).bind(alertId, monitor.id, monitor.user_id, monitor.property_name, monitor.metric, monitor.condition_type, percentChange).run();
            }
          }
        }
        
        await env.DB.prepare("UPDATE ga4_monitors SET last_checked_at = CURRENT_TIMESTAMP WHERE id = ?").bind(monitor.id).run();

      } catch (err) {
        logs.push(`Error checking monitor ${monitor.id}: ${err.message}`);
      }
    }

    return new Response(JSON.stringify({ status: 'ok', logs }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
