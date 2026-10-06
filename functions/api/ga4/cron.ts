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

        // 3. Query GA4 Data API for Today vs Yesterday
        let dateRanges = [
          { startDate: 'today', endDate: 'today' },
          { startDate: 'yesterday', endDate: 'yesterday' }
        ];

        if (monitor.comparison_period === 'weekly') {
          dateRanges = [
            { startDate: 'today', endDate: 'today' },
            { startDate: '7daysAgo', endDate: '7daysAgo' }
          ];
        } else if (monitor.comparison_period === 'monthly') {
          dateRanges = [
            { startDate: 'today', endDate: 'today' },
            { startDate: '28daysAgo', endDate: '28daysAgo' }
          ];
        } else if (monitor.comparison_period === 'yearly') {
          dateRanges = [
            { startDate: 'today', endDate: 'today' },
            { startDate: '365daysAgo', endDate: '365daysAgo' }
          ];
        }

        if (monitor.comparison_period === 'weekly') {
          dateRanges = [
            { startDate: 'today', endDate: 'today' },
            { startDate: '7daysAgo', endDate: '7daysAgo' }
          ];
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
        // Usually, rows[0] is today, rows[1] is comparison
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
