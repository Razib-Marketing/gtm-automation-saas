export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;

  try {
    const data = await request.json().catch(() => ({}));
    const { email } = data;

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: { message: 'Please provide a valid email address.' } }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resendApiKey = env.RESEND_API_KEY;
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: { message: 'Email service is not configured.' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clientIp = request.headers.get('cf-connecting-ip') || 'Unknown IP';
    const clientCountry = request.headers.get('cf-ipcountry') || 'Global';
    const clientCity = request.headers.get('cf-ipcity') || '';
    const subscribedAt = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short'
    }) + ' UTC';

    // 1. Human-Crafted Admin Notification
    const adminHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Subscriber</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
        
        <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 0px; line-height: 0px; max-width: 0px; opacity: 0;">
          New newsletter subscriber: ${email}
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 580px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); text-align: left;">
                
                <!-- Sleek Brand Header -->
                <tr>
                  <td style="background-color: #0F172A; padding: 24px 32px; border-bottom: 2px solid #00E5FF;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle">
                          <a href="https://gtmobserver.com" target="_blank" style="text-decoration: none; display: inline-block;">
                            <img src="https://gtmobserver.com/gtmobserver-logo.png" 
                                 alt="GTMObserver" 
                                 width="190" 
                                 height="35" 
                                 border="0" 
                                 style="display: block; width: 190px; height: 35px; max-width: 190px; max-height: 35px; border: 0; outline: none; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 800; color: #00E5FF; line-height: 35px;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 32px 32px 28px 32px;">
                    
                    <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0F172A;">
                      New newsletter subscriber
                    </h1>
                    
                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.5; color: #475569;">
                      A new user just subscribed to the GTMObserver newsletter:
                    </p>

                    <!-- Details Card -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 28px;">
                      <tr>
                        <td style="padding: 18px 20px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px;">
                                <span style="color: #64748B; font-weight: 500; display: inline-block; width: 80px;">Email:</span>
                                <a href="mailto:${email}" style="color: #0284C7; text-decoration: none; font-weight: 600; font-size: 16px;">${email}</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px;">
                                <span style="color: #64748B; font-weight: 500; display: inline-block; width: 80px;">Source:</span>
                                <span style="color: #334155;">Website Footer Form (gtmobserver.com)</span>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px;">
                                <span style="color: #64748B; font-weight: 500; display: inline-block; width: 80px;">Date:</span>
                                <span style="color: #334155;">${subscribedAt}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <a href="https://app.gtmobserver.com" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                            Open Dashboard &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; text-align: center; line-height: 1.5;">
                    Sent via GTMObserver &bull; <a href="https://gtmobserver.com" style="color: #64748B; text-decoration: none;">gtmobserver.com</a><br>
                    <span style="font-size: 11px; color: #CBD5E1;">IP: ${clientIp}${clientCity ? ' &bull; ' + clientCity : ''} &bull; Location: ${clientCountry}</span>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 2. Human-Crafted Subscriber Welcome Email
    const subscriberHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GTMObserver Insider</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
        
        <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 0px; line-height: 0px; max-width: 0px; opacity: 0;">
          Welcome to GTMObserver Insider! Here is your free Tracking Architecture Blueprint PDF.
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 580px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); text-align: left;">
                
                <!-- Sleek Brand Header -->
                <tr>
                  <td style="background-color: #0F172A; padding: 24px 32px; border-bottom: 2px solid #00E5FF;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle">
                          <a href="https://gtmobserver.com" target="_blank" style="text-decoration: none; display: inline-block;">
                            <img src="https://gtmobserver.com/gtmobserver-logo.png" 
                                 alt="GTMObserver" 
                                 width="190" 
                                 height="35" 
                                 border="0" 
                                 style="display: block; width: 190px; height: 35px; max-width: 190px; max-height: 35px; border: 0; outline: none; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 800; color: #00E5FF; line-height: 35px;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 32px 32px 28px 32px;">
                    
                    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0F172A;">
                      Welcome to GTMObserver Insider
                    </h1>
                    
                    <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                      Hi there,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                      Thanks for subscribing! Every couple of weeks, we send practical, production-ready tips on automated Google Tag Manager setups, Cloudflare edge analytics, and real-time GA4 anomaly detection.
                    </p>

                    <!-- Free Resource Download Card -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px;">
                          <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 6px;">
                            Your Free Gift: Tracking Architecture Blueprint
                          </div>
                          <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #64748B;">
                            Here is the direct link to download your comprehensive blueprint covering edge data layers, server-side GA4 pipelines, and zero-latency triggers.
                          </p>
                          <a href="https://gtmobserver.com/GTMObserver-Tracking-Architecture-Blueprint.pdf" target="_blank" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-size: 13px; font-weight: 600; text-decoration: none; padding: 11px 20px; border-radius: 6px;">
                            Download Blueprint (PDF) &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                      If you ever have any questions about tracking setups or have specific tag recipes you'd like us to cover, feel free to reply directly to this email anytime.
                    </p>

                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #64748B;">
                      Best regards,<br>
                      <strong style="color: #0F172A;">The GTMObserver Team</strong>
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; text-align: center; line-height: 1.5;">
                    &copy; ${new Date().getFullYear()} GTMObserver &bull; <a href="https://gtmobserver.com" style="color: #64748B; text-decoration: none;">gtmobserver.com</a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 1. Dispatch Admin Notification via Resend directly (No file attachments)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GTMObserver <info@gtmobserver.com>',
        to: ['ovi@razibmarketing.net'],
        reply_to: email,
        subject: `New newsletter subscriber: ${email}`,
        html: adminHtml
      })
    });

    const resendData = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      console.error('Newsletter Resend Error:', resendData);
      return new Response(JSON.stringify({ error: { message: resendData.message || 'Failed to dispatch newsletter subscription' } }), { 
        status: res.status, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 2. Dispatch Subscriber Welcome Email (Non-blocking) directly
    const sendWelcome = async () => {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'GTMObserver Team <info@gtmobserver.com>',
            to: [email],
            reply_to: 'info@gtmobserver.com',
            subject: `Welcome to GTMObserver Insider`,
            html: subscriberHtml
          })
        });
      } catch (e) {
        console.warn('Subscriber welcome dispatch failed:', e);
      }
    };

    if (waitUntil) {
      waitUntil(sendWelcome());
    } else {
      sendWelcome();
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (err) {
    console.error('Newsletter handler exception:', err);
    return new Response(JSON.stringify({ error: { message: err.message || 'Internal server error' } }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
