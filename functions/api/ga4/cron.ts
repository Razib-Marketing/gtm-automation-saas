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

        // 3. Query GA4 Data API for Selected Date Range
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

        // 4. Calculate Difference
        if (report.rows && report.rows.length >= 2) {
          const currentVal = parseFloat(report.rows[0].metricValues[0].value);
          const pastVal = parseFloat(report.rows[1].metricValues[0].value);

          if (pastVal > 0) {
            const percentChange = ((currentVal - pastVal) / pastVal) * 100;

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
                    html: `<p>Your monitor for <strong>${monitor.property_name}</strong> triggered an alert.</p>
                           <p><strong>Metric:</strong> ${monitor.metric}</p>
                           <p><strong>Current:</strong> ${currentVal}</p>
                           <p><strong>Previous:</strong> ${pastVal}</p>
                           <p><strong>Change:</strong> ${percentChange.toFixed(2)}%</p>`
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
