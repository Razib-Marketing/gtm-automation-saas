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

    // Parse monitor conditions
    let parsedConditions: Array<{ metric: string; source?: string; medium?: string; conditionType: string; thresholdPercentage: number }> = [];
    if (monitor.conditions) {
      try {
        parsedConditions = JSON.parse(monitor.conditions);
      } catch (_) {}
    }
    if (!parsedConditions || parsedConditions.length === 0) {
      parsedConditions = [
        {
          metric: monitor.metric || 'sessions',
          source: 'all',
          medium: 'all',
          conditionType: monitor.condition_type || 'drops_below',
          thresholdPercentage: monitor.threshold_percentage || -20
        }
      ];
    }
    const matchType: 'ALL' | 'ANY' = monitor.match_type === 'ALL' ? 'ALL' : 'ANY';

    // Map metrics for GA4 API (conversions -> keyEvents)
    const mapMetricName = (m: string) => (m === 'conversions' ? 'keyEvents' : m);

    // Group conditions by source and medium filters
    const getFilterKey = (c: { source?: string; medium?: string }) => {
      const s = (c.source && c.source !== 'all') ? c.source.trim().toLowerCase() : '';
      const m = (c.medium && c.medium !== 'all') ? c.medium.trim().toLowerCase() : '';
      return `${s}:::${m}`;
    };

    const groups: Record<string, { source: string; medium: string; metrics: Set<string> }> = {};
    for (const cond of parsedConditions) {
      const key = getFilterKey(cond);
      const s = (cond.source && cond.source !== 'all') ? cond.source.trim() : '';
      const m = (cond.medium && cond.medium !== 'all') ? cond.medium.trim() : '';
      if (!groups[key]) {
        groups[key] = { source: s, medium: m, metrics: new Set() };
      }
      groups[key].metrics.add(mapMetricName(cond.metric));
    }

    const buildReportBody = (dateRange: any, metricNames: string[], source: string, medium: string) => {
      const expressions: any[] = [];
      if (source) {
        expressions.push({
          filter: {
            fieldName: 'sessionSource',
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
    };

    const propertyId = monitor.property_id.startsWith('properties/')
      ? monitor.property_id
      : `properties/${monitor.property_id}`;

    // Query Current & Previous Windows for each dimension filter group
    const currentValLookup: Record<string, Record<string, number>> = {};
    const pastValLookup: Record<string, Record<string, number>> = {};

    for (const key of Object.keys(groups)) {
      const group = groups[key];
      const metricList = Array.from(group.metrics);

      const [currentRes, prevRes] = await Promise.all([
        fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(buildReportBody(currentRange, metricList, group.source, group.medium))
        }),
        fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(buildReportBody(previousRange, metricList, group.source, group.medium))
        })
      ]);

      const currentReport = await currentRes.json();
      if (!currentRes.ok) {
        return new Response(JSON.stringify({ 
          error: currentReport.error?.message || `Google Analytics Data API error (${currentRes.status})` 
        }), { status: currentRes.status, headers: { 'Content-Type': 'application/json' } });
      }

      const prevReport = await prevRes.json();
      if (!prevRes.ok) {
        return new Response(JSON.stringify({ 
          error: prevReport.error?.message || `Google Analytics Data API error (${prevRes.status})` 
        }), { status: prevRes.status, headers: { 'Content-Type': 'application/json' } });
      }

      currentValLookup[key] = {};
      pastValLookup[key] = {};

      if (currentReport.metricHeaders && currentReport.rows?.[0]?.metricValues) {
        currentReport.metricHeaders.forEach((header: any, index: number) => {
          currentValLookup[key][header.name] = parseFloat(currentReport.rows[0].metricValues[index]?.value || '0');
        });
      }

      if (prevReport.metricHeaders && prevReport.rows?.[0]?.metricValues) {
        prevReport.metricHeaders.forEach((header: any, index: number) => {
          pastValLookup[key][header.name] = parseFloat(prevReport.rows[0].metricValues[index]?.value || '0');
        });
      }
    }

    // Evaluate Each Condition
    const evaluatedConditions = parsedConditions.map(cond => {
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

      const threshold = Math.abs(cond.thresholdPercentage);
      let isTriggered = false;
      let actionText = '';
      const cType = cond.conditionType || 'drops_below';

      if (cType === 'drops_below' && percentChange <= -threshold) {
        isTriggered = true;
        actionText = 'dropped by';
      } else if (cType === 'spikes_above' && percentChange >= threshold) {
        isTriggered = true;
        actionText = 'spiked by';
      } else if (cType === 'changes_by' && Math.abs(percentChange) >= threshold) {
        isTriggered = true;
        actionText = percentChange > 0 ? 'increased by' : 'decreased by';
      }

      const sLabel = (cond.source && cond.source !== 'all') ? cond.source : 'All';
      const mLabel = (cond.medium && cond.medium !== 'all') ? cond.medium : 'All';

      return {
        metric: cond.metric,
        source: sLabel,
        medium: mLabel,
        conditionType: cType,
        thresholdPercentage: cond.thresholdPercentage,
        currentVal,
        pastVal,
        percentChange,
        isTriggered,
        actionText
      };
    });

    // 7. Compound Trigger Evaluation (ALL / ANY)
    const isTriggered = matchType === 'ALL'
      ? evaluatedConditions.every(c => c.isTriggered)
      : evaluatedConditions.some(c => c.isTriggered);

    const triggeredConditions = evaluatedConditions.filter(c => c.isTriggered);
    const primaryCond = evaluatedConditions[0] || { percentChange: 0, currentVal: 0, pastVal: 0 };

    // 8. Build Rich Email HTML
    const headerBg = isTriggered ? '#DC2626' : '#2563EB';
    const headerTitle = isTriggered ? '🚨 GA4 Anomaly Detected' : '✅ GA4 Monitor Health Check';
    const statusNote = isTriggered
      ? `<p style="font-size: 15px; color: #1F2937; margin: 0 0 16px 0;">
          Your Observer monitor for <strong>${monitor.property_name}</strong> triggered an alert based on your compound rule criteria (Match <strong>${matchType}</strong>).
        </p>`
      : `<p style="font-size: 15px; color: #1F2937; margin: 0 0 16px 0;">
          This is a manual health check for <strong>${monitor.property_name}</strong>. All evaluated conditions are within expected parameters.
        </p>`;

    const rowsHtml = evaluatedConditions.map(c => {
      const changeColor = c.percentChange > 0 ? '#059669' : '#DC2626';
      const statusBadge = c.isTriggered
        ? '<span style="background: #FEE2E2; color: #991B1B; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">TRIGGERED</span>'
        : '<span style="background: #D1FAE5; color: #065F46; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">OK</span>';
      
      const opText = c.conditionType === 'spikes_above' ? `Spikes > ${Math.abs(c.thresholdPercentage)}%`
        : c.conditionType === 'changes_by' ? `Changes ± ${Math.abs(c.thresholdPercentage)}%`
        : `Drops < -${Math.abs(c.thresholdPercentage)}%`;

      const segmentBadge = (c.source !== 'All' || c.medium !== 'All')
        ? `<div style="font-size: 11px; color: #6366F1; font-weight: 500; margin-top: 2px;">${c.source} / ${c.medium}</div>`
        : `<div style="font-size: 11px; color: #9CA3AF; margin-top: 2px;">All Traffic</div>`;

      return `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 10px 12px; font-weight: 600; color: #111827;">
            ${c.metric}
            ${segmentBadge}
          </td>
          <td style="padding: 10px 12px; color: #6B7280; font-size: 12px;">${opText}</td>
          <td style="padding: 10px 12px; color: #374151;">${c.pastVal.toLocaleString()}</td>
          <td style="padding: 10px 12px; color: #374151; font-weight: 600;">${c.currentVal.toLocaleString()}</td>
          <td style="padding: 10px 12px; font-weight: 700; color: ${changeColor};">
            ${c.percentChange > 0 ? '+' : ''}${c.percentChange.toFixed(1)}%
          </td>
          <td style="padding: 10px 12px; text-align: right;">${statusBadge}</td>
        </tr>
      `;
    }).join('');

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; background-color: #FFFFFF;">
        <div style="background-color: ${headerBg}; color: #FFFFFF; padding: 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">${headerTitle}</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Property: ${monitor.property_name}</p>
        </div>
        <div style="padding: 24px;">
          ${statusNote}

          <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; color: #4B5563; display: flex; justify-content: space-between;">
            <div><strong>Rule Logic:</strong> Match ${matchType === 'ALL' ? 'ALL conditions (AND)' : 'ANY condition (OR)'}</div>
            <div><strong>Comparison Period:</strong> ${monitor.comparison_period.replace(/_/g, ' ')}</div>
          </div>

          <div style="border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; margin-top: 12px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
              <thead>
                <tr style="background-color: #F3F4F6; border-bottom: 1px solid #E5E7EB; color: #4B5563; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">
                  <th style="padding: 8px 12px;">Metric</th>
                  <th style="padding: 8px 12px;">Rule</th>
                  <th style="padding: 8px 12px;">Prev</th>
                  <th style="padding: 8px 12px;">Curr</th>
                  <th style="padding: 8px 12px;">Change</th>
                  <th style="padding: 8px 12px; text-align: right;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <p style="margin-top: 24px; font-size: 11px; color: #9CA3AF; text-align: center;">
            Automated monitoring by <strong>GTM & Analytics Automation SaaS</strong> • Real-time Anomaly Observer
          </p>
        </div>
      </div>
    `;

    let subject = '';
    if (isTriggered) {
      if (matchType === 'ALL') {
        subject = `🚨 GA4 Compound Alert: ${monitor.property_name} (ALL Conditions Matched)`;
      } else {
        const topTrigger = triggeredConditions[0];
        subject = `🚨 GA4 Alert: ${monitor.property_name} (${topTrigger.metric} ${topTrigger.actionText} ${Math.abs(topTrigger.percentChange).toFixed(1)}%)`;
      }
    } else {
      subject = `✅ Health Check: ${monitor.property_name} is stable`;
    }

    let emailStatus = 'Not sent';
    let emailError: string | null = null;

    // 1. Try Cloudflare Native Email binding (send_email) if configured
    if (env.EMAIL && typeof env.EMAIL.send === 'function') {
      try {
        await env.EMAIL.send({
          to: monitor.alert_email,
          from: { email: 'alerts@gtm-automation-saas.ovi-e69.workers.dev', name: 'GA4 Observer' },
          subject: subject,
          html: htmlBody,
          text: `GA4 Observer: ${monitor.property_name} status update.`
        });
        emailStatus = 'Sent via Cloudflare Email Service';
      } catch (err: any) {
        emailError = `Cloudflare Email Service: ${err.message}`;
      }
    }

    // 2. Cloudflare MailChannels outbound relay (default Cloudflare Workers outbound email)
    if (emailStatus === 'Not sent') {
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
          emailStatus = 'Sent via Cloudflare (MailChannels Relay)';
          emailError = null;
        } else {
          const mcErr = await mcRes.text().catch(() => '');
          emailError = `Cloudflare Relay (${mcRes.status}): ${mcErr || mcRes.statusText}`;
        }
      } catch (mcErr: any) {
        emailError = `Cloudflare Relay failed: ${mcErr.message}`;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      isTriggered, 
      matchType,
      conditions: evaluatedConditions,
      percentChange: primaryCond.percentChange,
      currentVal: primaryCond.currentVal,
      pastVal: primaryCond.pastVal,
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
