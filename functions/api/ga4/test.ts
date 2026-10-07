export async function onRequest(context: any) {
  const { env, request } = context;

  // Verify Auth
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { monitorId } = await request.json();
    if (!monitorId) {
      return new Response(JSON.stringify({ error: 'Missing monitorId' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const monitor = await env.DB.prepare(
      "SELECT * FROM ga4_monitors WHERE id = ?"
    ).bind(monitorId).first();

    if (!monitor) {
      return new Response(JSON.stringify({ error: 'Monitor not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Get User's Refresh Token
    const userConn = await env.DB.prepare(
      "SELECT encrypted_refresh_token FROM gtm_connections WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(monitor.user_id).first();

    if (!userConn || !userConn.encrypted_refresh_token || userConn.encrypted_refresh_token === 'no_refresh_token_provided') {
      return new Response(JSON.stringify({ 
        error: 'Google account not connected or missing refresh token. Please re-authenticate Google on the Dashboard.' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

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
    if (!tokenRes.ok || !tokenData.access_token) {
      const detail = tokenData.error_description || tokenData.error || JSON.stringify(tokenData);
      return new Response(JSON.stringify({ 
        error: `Failed to refresh Google token (${detail}). Please re-authenticate your Google account.` 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const accessToken = tokenData.access_token;

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

    // 4. Query Current Window
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
    if (!currentRes.ok) {
      return new Response(JSON.stringify({ 
        error: currentReport.error?.message || `Google Analytics Data API error (${currentRes.status})` 
      }), { status: currentRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    // 5. Query Previous Window
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
    if (!prevRes.ok) {
      return new Response(JSON.stringify({ 
        error: prevReport.error?.message || `Google Analytics Data API error (${prevRes.status})` 
      }), { status: prevRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    const currentVal = parseFloat(currentReport.rows?.[0]?.metricValues?.[0]?.value || '0');
    const pastVal = parseFloat(prevReport.rows?.[0]?.metricValues?.[0]?.value || '0');

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

    const subject = isTriggered 
      ? `🚨 GA4 Alert: ${monitor.property_name} ${actionText} ${Math.abs(percentChange).toFixed(1)}%`
      : `✅ Health Check: ${monitor.property_name} is stable (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%)`;

    let emailStatus = 'Not sent';
    let emailError: string | null = null;

    // 1. Try Resend if configured
    if (env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Observer <onboarding@resend.dev>',
            to: monitor.alert_email,
            subject: subject,
            html: htmlBody
          })
        });
        const resendData: any = await resendRes.json().catch(() => ({}));
        if (resendRes.ok) {
          emailStatus = 'Sent via Resend';
        } else {
          emailError = `Resend (${resendRes.status}): ${resendData.message || resendData.error || resendRes.statusText}`;
        }
      } catch (err: any) {
        emailError = `Resend error: ${err.message}`;
      }
    }

    // 2. Cloudflare MailChannels relay (if Resend failed or not configured)
    if (emailStatus !== 'Sent via Resend') {
      try {
        const mcRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: monitor.alert_email }] }],
            from: { email: 'alerts@gtm-automation-saas.ovi-e69.workers.dev', name: 'GA4 Observer' },
            subject: subject,
            content: [
              { type: 'text/html', value: htmlBody },
              { type: 'text/plain', value: `GA4 Observer: ${monitor.property_name} status update.` }
            ]
          })
        });
        if (mcRes.ok) {
          emailStatus = 'Sent via Cloudflare (MailChannels)';
          emailError = null;
        } else {
          const mcErr = await mcRes.text().catch(() => '');
          if (!emailError) emailError = `Cloudflare relay error: ${mcErr || mcRes.statusText}`;
        }
      } catch (mcErr: any) {
        if (!emailError) emailError = `Cloudflare relay failed: ${mcErr.message}`;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      isTriggered, 
      percentChange,
      currentVal,
      pastVal,
      emailStatus,
      emailError
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
