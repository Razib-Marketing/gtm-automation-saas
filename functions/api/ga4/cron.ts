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

        const GA4_CHANNEL_GROUPS = [
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

        const isChannelGroup = (val: string) => {
          if (!val) return false;
          if (val === 'direct') return false;
          return GA4_CHANNEL_GROUPS.includes(val.trim().toLowerCase());
        };

        const buildReportBody = (dateRange: any, metricNames: string[], source: string, medium: string) => {
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
        let fetchFailed = false;

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
          const prevReport = await prevRes.json();

          if (!currentRes.ok || !prevRes.ok) {
            fetchFailed = true;
            break;
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

        if (fetchFailed) continue;

        // Evaluate each condition
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

        // Compound Trigger Evaluation (ALL / ANY)
        const isTriggered = matchType === 'ALL'
          ? evaluatedConditions.every(c => c.isTriggered)
          : evaluatedConditions.some(c => c.isTriggered);

        if (isTriggered) {
          const triggeredConditions = evaluatedConditions.filter(c => c.isTriggered);

          const rowsHtml = evaluatedConditions.map(c => {
            const changeColor = c.percentChange > 0 ? '#059669' : '#DC2626';
            const statusBadge = c.isTriggered
              ? '<span style="background: #FEE2E2; color: #991B1B; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">TRIGGERED</span>'
              : '<span style="background: #D1FAE5; color: #065F46; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700;">OK</span>';
            
            const opText = c.conditionType === 'spikes_above' ? `Spikes > ${Math.abs(c.thresholdPercentage)}%`
              : c.conditionType === 'changes_by' ? `Changes ± ${Math.abs(c.thresholdPercentage)}%`
              : `Drops < -${Math.abs(c.thresholdPercentage)}%`;

            let segmentText = '';
            if (c.source !== 'All' && c.medium !== 'All') {
              segmentText = `${c.source} / ${c.medium}`;
            } else if (c.source !== 'All') {
              segmentText = c.source;
            } else if (c.medium !== 'All') {
              segmentText = `Medium: ${c.medium}`;
            }

            const segmentBadge = segmentText
              ? `<div style="font-size: 11px; color: #6366F1; font-weight: 500; margin-top: 2px;">${segmentText}</div>`
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
              <div style="background-color: #DC2626; color: #FFFFFF; padding: 24px; text-align: center;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">🚨 GA4 Anomaly Detected</h2>
                <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Property: ${monitor.property_name}</p>
              </div>
              <div style="padding: 24px;">
                <p style="font-size: 15px; color: #1F2937; margin: 0 0 16px 0;">
                  Your Observer monitor for <strong>${monitor.property_name}</strong> triggered an anomaly alert based on your compound rule criteria (Match <strong>${matchType}</strong>).
                </p>

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
          if (matchType === 'ALL') {
            subject = `🚨 GA4 Compound Alert: ${monitor.property_name} (ALL Conditions Matched)`;
          } else {
            const topTrigger = triggeredConditions[0] || evaluatedConditions[0];
            let segStr = '';
            if (topTrigger.source !== 'All' && topTrigger.medium !== 'All') {
              segStr = ` [${topTrigger.source} / ${topTrigger.medium}]`;
            } else if (topTrigger.source !== 'All') {
              segStr = ` [${topTrigger.source}]`;
            } else if (topTrigger.medium !== 'All') {
              segStr = ` [Medium: ${topTrigger.medium}]`;
            }
            subject = `🚨 GA4 Alert: ${monitor.property_name} (${topTrigger.metric}${segStr} ${topTrigger.actionText} ${Math.abs(topTrigger.percentChange).toFixed(1)}%)`;
          }

          let emailSent = false;

          // 1. Try Cloudflare Email Service binding if available
          if (env.EMAIL && typeof env.EMAIL.send === 'function') {
            try {
              await env.EMAIL.send({
                to: monitor.alert_email,
                from: { email: 'alerts@gtm-automation-saas.ovi-e69.workers.dev', name: 'GA4 Observer' },
                subject: subject,
                html: htmlBody,
                text: `GA4 Alert: ${monitor.property_name}`
              });
              emailSent = true;
            } catch (_) {}
          }

          // 2. Cloudflare MailChannels outbound relay (default Cloudflare Workers outbound email)
          if (!emailSent) {
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
                    { type: 'text/plain', value: `GA4 Alert: ${monitor.property_name}` }
                  ]
                })
              });
              if (mcRes.ok) emailSent = true;
            } catch (_) {}
          }

          logs.push(`Alerted ${monitor.alert_email} for ${monitor.property_name}`);

          // Log each triggered condition to Database
          for (const cond of triggeredConditions) {
            const alertId = 'alt_' + Date.now() + Math.random().toString(36).substring(2, 9);
            let metricDisplay = cond.metric;
            if (cond.source !== 'All' && cond.medium !== 'All') {
              metricDisplay = `${cond.metric} [${cond.source} / ${cond.medium}]`;
            } else if (cond.source !== 'All') {
              metricDisplay = `${cond.metric} [${cond.source}]`;
            } else if (cond.medium !== 'All') {
              metricDisplay = `${cond.metric} [Medium: ${cond.medium}]`;
            }
            await env.DB.prepare(
              "INSERT INTO ga4_alerts (id, monitor_id, user_id, property_name, metric, condition_type, percent_change) VALUES (?, ?, ?, ?, ?, ?, ?)"
            ).bind(alertId, monitor.id, monitor.user_id, monitor.property_name, metricDisplay, cond.conditionType, cond.percentChange).run();
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
