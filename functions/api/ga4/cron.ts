async function ensureAlertsSchema(db: any) {
  try {
    await db.prepare("ALTER TABLE ga4_alerts ADD COLUMN alert_type TEXT DEFAULT 'automated'").run();
  } catch (_) {}
  try {
    await db.prepare("ALTER TABLE ga4_alerts ADD COLUMN status TEXT DEFAULT 'anomaly'").run();
  } catch (_) {}
  try {
    await db.prepare("ALTER TABLE ga4_alerts ADD COLUMN recipients TEXT").run();
  } catch (_) {}
}

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

          // Helper to sanitize property name into a clean, professional brand/site name
          const formatCleanPropertyName = (rawName?: string): string => {
            if (!rawName) return 'GA4 Property';
            let name = rawName.trim();
            if (name.includes(' > ')) {
              const parts = name.split(' > ').map(s => s.trim());
              const account = parts[0];
              const prop = parts[1] || '';
              const cleanProp = prop
                .replace(/\/\s*GA4\b.*/i, '')
                .replace(/-\s*GA4\b.*/i, '')
                .replace(/\bGA4\s*-\s*MonsterInsights\b/i, '')
                .replace(/\bMonsterInsights\b/i, '')
                .replace(/\bGA4\b/i, '')
                .replace(/\/+$/, '')
                .trim();
              if (account.toLowerCase() === cleanProp.toLowerCase() || !cleanProp) {
                name = account;
              } else if (cleanProp.includes('.') && !account.includes('.')) {
                name = account;
              } else {
                name = account || cleanProp;
              }
            } else if (name.includes('>')) {
              name = name.split('>')[0].trim();
            }
            return name
              .replace(/\/\s*GA4\b.*/i, '')
              .replace(/-\s*GA4\b.*/i, '')
              .replace(/\bGA4\s*-\s*MonsterInsights\b/i, '')
              .replace(/\bMonsterInsights\b/i, '')
              .replace(/\bGA4\b/i, '')
              .replace(/\/+$/, '')
              .trim() || rawName;
          };

          const cleanName = formatCleanPropertyName(monitor.property_name);

          const conditionCardsHtml = evaluatedConditions.map(c => {
            const isNegative = c.percentChange < 0;
            const changeColor = isNegative ? '#DC2626' : '#0284C7';
            const changeBg = isNegative ? '#FEF2F2' : '#F0F9FF';
            const changeBorder = isNegative ? '#FCA5A5' : '#BAE6FD';
            const cardAccent = c.isTriggered ? '#DC2626' : '#00F0FF';
            
            const statusBadge = c.isTriggered
              ? '<span style="display: inline-block; background-color: #FEF2F2; color: #DC2626; border: 1px solid #FCA5A5; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em;">⚠ TRIGGERED</span>'
              : '<span style="display: inline-block; background-color: #0B0F19; color: #00F0FF; border: 1px solid #00F0FF; padding: 3px 10px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em;">✔ OK</span>';
            
            const opText = c.conditionType === 'spikes_above' ? `Spikes > ${Math.abs(c.thresholdPercentage)}%`
              : c.conditionType === 'changes_by' ? `Changes ± ${Math.abs(c.thresholdPercentage)}%`
              : `Drops < -${Math.abs(c.thresholdPercentage)}%`;

            let segmentText = 'All Traffic';
            if (c.source !== 'All' && c.medium !== 'All') {
              segmentText = `${c.source} / ${c.medium}`;
            } else if (c.source !== 'All') {
              segmentText = c.source;
            } else if (c.medium !== 'All') {
              segmentText = `Medium: ${c.medium}`;
            }

            return `
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate; border-spacing: 0; width: 100%; margin-bottom: 12px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid ${cardAccent}; border-radius: 8px;">
                <tr>
                  <td style="padding: 12px 14px;">
                    <!-- Header Row: Metric Name & Segment on left, Status Pill on right -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; width: 100%;">
                      <tr>
                        <td style="vertical-align: middle; text-align: left;">
                          <div style="font-size: 15px; font-weight: 700; color: #0F172A; text-transform: capitalize;">
                            ${c.metric}
                          </div>
                          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                            Channel: <strong style="color: #475569;">${segmentText}</strong>
                          </div>
                        </td>
                        <td style="vertical-align: middle; text-align: right; white-space: nowrap;">
                          ${statusBadge}
                        </td>
                      </tr>
                    </table>

                    <!-- Data Row: Baseline -> Current & % Change -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; width: 100%; margin-top: 10px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px;">
                      <tr>
                        <td style="padding: 9px 12px; text-align: left; vertical-align: middle;">
                          <div style="font-size: 11px; color: #64748B; text-transform: uppercase; font-weight: 600; letter-spacing: 0.03em;">
                            Baseline: <strong style="color: #334155;">${c.pastVal.toLocaleString()}</strong>
                            <span style="color: #94A3B8; margin: 0 4px;">→</span>
                            Current: <strong style="color: #0F172A;">${c.currentVal.toLocaleString()}</strong>
                          </div>
                          <div style="font-size: 11px; color: #94A3B8; margin-top: 3px;">
                            Rule: <span style="color: #64748B;">${opText}</span>
                          </div>
                        </td>
                        <td style="padding: 9px 12px; text-align: right; vertical-align: middle; white-space: nowrap;">
                          <span style="display: inline-block; font-size: 13px; font-weight: 800; color: ${changeColor}; background-color: ${changeBg}; border: 1px solid ${changeBorder}; padding: 3px 9px; border-radius: 5px;">
                            ${c.percentChange > 0 ? '+' : ''}${c.percentChange.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            `;
          }).join('');

          const htmlBody = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                title, style { display: none !important; }
              </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
              <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 0px; line-height: 0px; max-width: 0px; opacity: 0;">
                GA4 Anomaly Alert for ${cleanName}
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; margin: 0; padding: 20px 10px; width: 100%;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
                      <!-- Header Banner -->
                      <tr>
                        <td style="background-color: #DC2626; color: #FFFFFF; padding: 26px 20px; text-align: center; border-bottom: 2px solid #B91C1C;">
                          <div style="margin-bottom: 12px;">
                            <span style="display: inline-block; width: 46px; height: 46px; line-height: 46px; border-radius: 50%; background: #991B1B; color: #FFFFFF; font-size: 22px; font-weight: 900; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">⚠</span>
                          </div>
                          <h2 style="margin: 0; font-size: 21px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.025em;">GA4 Anomaly Detected</h2>
                          <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); font-weight: 600;">Property: ${cleanName}</p>
                        </td>
                      </tr>

                      <!-- Content Area -->
                      <tr>
                        <td style="padding: 20px 16px;">
                          <p style="font-size: 15px; color: #1F2937; margin: 0 0 16px 0; line-height: 1.5;">
                            Your Observer monitor for <strong>${cleanName}</strong> triggered an anomaly alert based on your compound rule criteria (Match <strong>${matchType}</strong>).
                          </p>

                          <!-- Meta Information Box -->
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 16px;">
                            <tr>
                              <td style="padding: 10px 14px; font-size: 12px; color: #4B5563; text-align: left;">
                                <div><strong>Rule Logic:</strong> Match ${matchType === 'ALL' ? 'ALL conditions (AND)' : 'ANY condition (OR)'}</div>
                                <div style="margin-top: 4px;"><strong>Comparison Period:</strong> ${monitor.comparison_period.replace(/_/g, ' ')}</div>
                              </td>
                            </tr>
                          </table>

                          <!-- Responsive Metric Cards List -->
                          <div style="margin-top: 8px;">
                            ${conditionCardsHtml}
                          </div>

                          <!-- Footer -->
                          <p style="margin: 24px 0 0 0; font-size: 11px; color: #94A3B8; text-align: center; line-height: 1.5;">
                            Automated monitoring by <strong>GTM & Analytics Automation SaaS</strong><br>
                            Real-time Anomaly Observer
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `;

          let subject = '';
          if (matchType === 'ALL') {
            subject = `GA4 Alert: ${cleanName} (All Conditions Triggered)`;
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
            subject = `GA4 Alert: ${cleanName} — ${topTrigger.metric}${segStr} ${topTrigger.actionText} ${Math.abs(topTrigger.percentChange).toFixed(1)}%`;
          }

          const alertEmails = monitor.alert_email
            ? monitor.alert_email.split(/[,;\s]+/).map((e: string) => e.trim()).filter((e: string) => e.length > 0 && e.includes('@'))
            : [];
          const recipients = alertEmails.length > 0 ? alertEmails : [monitor.alert_email.trim()];

          let emailSent = false;
          const resendApiKey = env.RESEND_API_KEY;

          // 1. Try Resend
          if (resendApiKey) {
            try {
              // Check if a custom domain is verified on Resend
              let cronSenderEmail = 'onboarding@resend.dev';
              try {
                const domRes = await fetch('https://api.resend.com/domains', {
                  headers: { 'Authorization': `Bearer ${resendApiKey}` }
                });
                if (domRes.ok) {
                  const domData: any = await domRes.json();
                  const verified = domData.data?.find((d: any) => d.status === 'verified');
                  if (verified) {
                    cronSenderEmail = `alerts@${verified.name}`;
                  }
                }
              } catch (_) {}

              const cronSenderFrom = `GTMObserver <${cronSenderEmail}>`;

              const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: cronSenderFrom,
                  to: recipients,
                  subject: subject,
                  html: htmlBody
                })
              });
              if (resendRes.ok) {
                emailSent = true;
              } else if (recipients.length > 1) {
                // Fallback: send individually to each recipient
                for (const r of recipients) {
                  try {
                    const sRes = await fetch('https://api.resend.com/emails', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        from: cronSenderFrom,
                        to: [r],
                        subject: subject,
                        html: htmlBody
                      })
                    });
                    if (sRes.ok) emailSent = true;
                  } catch (_) {}
                }
              }
            } catch (_) {}
          }

          // 2. Try Cloudflare Email Service binding if available
          if (!emailSent && env.EMAIL && typeof env.EMAIL.send === 'function') {
            try {
              for (const r of recipients) {
                await env.EMAIL.send({
                  to: r,
                  from: { email: 'alerts@gtm-automation-saas.ovi-e69.workers.dev', name: 'GTMObserver' },
                  subject: subject,
                  html: htmlBody,
                  text: `GA4 Alert: ${monitor.property_name}`
                });
              }
              emailSent = true;
            } catch (_) {}
          }

          // 3. Cloudflare MailChannels outbound relay (fallback)
          if (!emailSent) {
            try {
              const mcRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  personalizations: [{ to: recipients.map((r: string) => ({ email: r })) }],
                  from: { email: 'alerts@gtm-automation-saas.ovi-e69.workers.dev', name: 'GTMObserver' },
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

          logs.push(`Alerted ${recipients.join(', ')} for ${monitor.property_name}`);

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
            try {
              await ensureAlertsSchema(env.DB);
              await env.DB.prepare(
                `INSERT INTO ga4_alerts (id, monitor_id, user_id, property_name, metric, condition_type, percent_change, alert_type, status, recipients) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'automated', 'anomaly', ?)`
              ).bind(
                alertId, 
                monitor.id, 
                monitor.user_id, 
                monitor.property_name, 
                metricDisplay, 
                cond.conditionType, 
                cond.percentChange,
                recipients.join(', ')
              ).run();
            } catch (_) {
              await env.DB.prepare(
                "INSERT INTO ga4_alerts (id, monitor_id, user_id, property_name, metric, condition_type, percent_change) VALUES (?, ?, ?, ?, ?, ?, ?)"
              ).bind(alertId, monitor.id, monitor.user_id, monitor.property_name, metricDisplay, cond.conditionType, cond.percentChange).run();
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
