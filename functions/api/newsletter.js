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

    const clientIp = request.headers.get('cf-connecting-ip') || 'Unknown IP';
    const clientCountry = request.headers.get('cf-ipcountry') || 'Global';
    const clientCity = request.headers.get('cf-ipcity') || '';
    const rayId = request.headers.get('cf-ray') || 'Edge';
    const subscribedAt = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short'
    }) + ' UTC';

    // 1. Admin Alert Email Template
    const adminHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          title, style { display: none !important; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 0px; line-height: 0px; max-width: 0px; opacity: 0;">
          New newsletter subscriber: ${email} — GTMObserver Platform
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #030712; margin: 0; padding: 24px 12px; width: 100%;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.5);">
                
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%); padding: 28px 24px; text-align: left; border-bottom: 1px solid #1E293B;">
                    <img src="https://gtmobserver.com/gtmobserver-logo.webp" alt="GTMObserver" height="36" style="display: block; border: 0; margin-bottom: 14px;" />
                    <span style="display: inline-block; background-color: rgba(56, 189, 248, 0.12); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px;">
                      📬 NEW NEWSLETTER SUBSCRIBER
                    </span>
                    <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">New Audience Member</h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8;">Subscribed via Website Footer</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 24px 20px;">
                    
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #131E32; border: 1px solid #1E293B; border-radius: 8px; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 18px 20px;">
                          <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 6px;">
                            Subscriber Email Address
                          </div>
                          <div style="font-size: 18px; font-weight: 700; color: #00F0FF;">
                            <a href="mailto:${email}" style="color: #00F0FF; text-decoration: none;">${email}</a>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Telemetry & Edge Metadata -->
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 8px;">
                      Subscriber Acquisition Metadata
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0B1120; border: 1px solid #1E293B; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 14px 16px; font-size: 12px; color: #94A3B8;">
                          <div style="margin-bottom: 4px;"><strong>Timestamp:</strong> <span style="color: #F8FAFC;">${subscribedAt}</span></div>
                          <div style="margin-bottom: 4px;"><strong>Location:</strong> <span style="color: #F8FAFC;">${clientCountry}${clientCity ? ' &bull; ' + clientCity : ''} (IP: ${clientIp})</span></div>
                          <div style="margin-bottom: 4px;"><strong>Acquisition Source:</strong> <span style="color: #F8FAFC;">Footer Newsletter Form (gtmobserver.com)</span></div>
                          <div><strong>Cloudflare Ray ID:</strong> <span style="color: #00F0FF; font-family: monospace;">${rayId}</span></div>
                        </td>
                      </tr>
                    </table>

                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="left">
                          <a href="https://app.gtmobserver.com" style="display: inline-block; background-color: #00F0FF; color: #050B14; font-size: 13px; font-weight: 700; padding: 12px 22px; border-radius: 6px; text-decoration: none;">
                            Open GTMObserver Platform &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #0B1120; padding: 18px 20px; text-align: center; border-top: 1px solid #1E293B; font-size: 11px; color: #64748B;">
                    Delivered via GTMObserver Edge Architecture &bull; <a href="https://gtmobserver.com" style="color: #94A3B8; text-decoration: none;">gtmobserver.com</a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 2. Subscriber Welcome Email Template
    const subscriberHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          title, style { display: none !important; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 0px; line-height: 0px; max-width: 0px; opacity: 0;">
          Welcome to GTMObserver Insider! Here is your free Tracking Architecture Blueprint PDF.
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #030712; margin: 0; padding: 24px 12px; width: 100%;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.5);">
                
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%); padding: 28px 24px; text-align: left; border-bottom: 1px solid #1E293B;">
                    <img src="https://gtmobserver.com/gtmobserver-logo.webp" alt="GTMObserver" height="36" style="display: block; border: 0; margin-bottom: 14px;" />
                    <span style="display: inline-block; background-color: rgba(0, 240, 255, 0.12); color: #00F0FF; border: 1px solid rgba(0, 240, 255, 0.3); font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px;">
                      🚀 WELCOME TO GTM OBSERVER INSIDER
                    </span>
                    <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">Welcome to the Platform</h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8;">Edge-Native Analytics & Tracking Automation</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 24px 20px;">
                    <p style="font-size: 15px; color: #E2E8F0; margin: 0 0 14px 0; line-height: 1.6;">
                      Thank you for subscribing to <strong>GTMObserver Insider</strong>.
                    </p>
                    <p style="font-size: 14px; color: #94A3B8; margin: 0 0 20px 0; line-height: 1.6;">
                      You are now part of an elite community of analytics engineers and digital marketers leveraging Cloudflare edge architecture, automated GTM recipes, and real-time GA4 anomaly detection.
                    </p>

                    <!-- Free Resource Download Card -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #131E32 0%, #172554 100%); border: 1px solid #1E40AF; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px;">
                          <div style="font-size: 11px; text-transform: uppercase; color: #38BDF8; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 4px;">
                            Your Welcome Gift
                          </div>
                          <div style="font-size: 17px; font-weight: 800; color: #FFFFFF; margin-bottom: 6px;">
                            GTMObserver Tracking Architecture Blueprint (PDF)
                          </div>
                          <p style="font-size: 13px; color: #94A3B8; margin: 0 0 16px 0; line-height: 1.5;">
                            Download your comprehensive blueprint covering edge data layers, server-side GA4 pipelines, and zero-latency triggers.
                          </p>
                          <a href="https://gtmobserver.com/GTMObserver-Tracking-Architecture-Blueprint.pdf" target="_blank" style="display: inline-block; background-color: #00F0FF; color: #050B14; font-size: 13px; font-weight: 800; padding: 12px 22px; border-radius: 6px; text-decoration: none;">
                            📥 Download Architecture Blueprint &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- What's Inside Feature Grid -->
                    <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 10px;">
                      What You'll Receive in Future Editions:
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0B1120; border: 1px solid #1E293B; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 14px 16px; font-size: 13px; color: #CBD5E1; line-height: 1.6;">
                          <div style="margin-bottom: 8px;">⚡ <strong>One-Click GTM Recipes:</strong> Elementor, Gravity Forms, WooCommerce, SynXis, and custom checkout flows.</div>
                          <div style="margin-bottom: 8px;">🎯 <strong>GA4 Observer Insights:</strong> Setting up compound anomaly triggers to stop ad spend loss on broken forms.</div>
                          <div>🌐 <strong>Cloudflare Edge Hacks:</strong> Serving tags with 0ms performance penalty and full privacy compliance.</div>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 13px; color: #64748B; margin: 0; line-height: 1.5;">
                      Want to test out our automated tracking features? <a href="https://gtmobserver.com" style="color: #00F0FF; text-decoration: none;">Explore our platform modules</a> anytime.
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #0B1120; padding: 18px 20px; text-align: center; border-top: 1px solid #1E293B; font-size: 11px; color: #64748B;">
                    &copy; ${new Date().getFullYear()} GTMObserver. All rights reserved. &bull; <a href="https://gtmobserver.com" style="color: #94A3B8; text-decoration: none;">gtmobserver.com</a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 1. Dispatch Admin Notification via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GTMObserver <alerts@gtmobserver.com>',
        to: ['ovi.cse23@gmail.com'],
        subject: `📬 New Newsletter Subscriber: ${email}`,
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

    // 2. Dispatch Subscriber Welcome Email (Non-blocking)
    const sendWelcome = async () => {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'GTMObserver Team <alerts@gtmobserver.com>',
            to: [email],
            subject: `Welcome to GTMObserver Insider 🚀 + Free Tracking Blueprint`,
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
