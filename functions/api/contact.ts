export async function onRequestPost(context: any) {
  const { request, env, waitUntil } = context;

  try {
    const data = await request.json().catch(() => ({}));
    const { name, email, message } = data;

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: { message: 'Please fill in all required fields (Name, Email, and Message).' } }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resendApiKey = env.RESEND_API_KEY;

    const clientIp = request.headers.get('cf-connecting-ip') || 'Unknown IP';
    const clientCountry = request.headers.get('cf-ipcountry') || 'Global';
    const clientCity = request.headers.get('cf-ipcity') || '';
    const rayId = request.headers.get('cf-ray') || 'Edge';
    const submittedAt = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short'
    }) + ' UTC';

    // 1. Enterprise Admin Notification Email Template
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
        <!-- Preheader snippet -->
        <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 0px; line-height: 0px; max-width: 0px; opacity: 0;">
          New high-priority inquiry from ${name} (${email}) — GTMObserver Platform Contact
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #030712; margin: 0; padding: 24px 12px; width: 100%;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.5);">
                
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%); padding: 28px 24px; text-align: left; border-bottom: 1px solid #1E293B;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
                      <img src="https://gtmobserver.com/gtmobserver-logo.webp" alt="GTMObserver" height="36" style="display: block; border: 0;" />
                    </div>
                    <div style="margin-top: 14px;">
                      <span style="display: inline-block; background-color: rgba(0, 240, 255, 0.12); color: #00F0FF; border: 1px solid rgba(0, 240, 255, 0.3); font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px;">
                        ⚡ NEW INQUIRY / LEAD DETECTED
                      </span>
                    </div>
                    <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">New Message from ${name}</h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8;">Submitted via GTMObserver Edge-Native Platform</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 24px 20px;">
                    
                    <!-- Lead Profile Card -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #131E32; border: 1px solid #1E293B; border-radius: 8px; margin-bottom: 18px;">
                      <tr>
                        <td style="padding: 16px 18px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="vertical-align: top; width: 44px;">
                                <div style="width: 40px; height: 40px; line-height: 40px; border-radius: 50%; background: linear-gradient(135deg, #00F0FF, #3B82F6); color: #0F172A; text-align: center; font-weight: 800; font-size: 16px;">
                                  ${(name.charAt(0) || 'U').toUpperCase()}
                                </div>
                              </td>
                              <td style="vertical-align: top; padding-left: 14px;">
                                <div style="font-size: 16px; font-weight: 700; color: #FFFFFF;">${name}</div>
                                <div style="font-size: 13px; color: #94A3B8; margin-top: 2px;">
                                  <a href="mailto:${email}" style="color: #00F0FF; text-decoration: none; font-weight: 500;">${email}</a>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Message Card -->
                    <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 8px;">
                      Inquiry Details & Message
                    </div>
                    <div style="background-color: #090D16; border: 1px solid #1E293B; border-left: 4px solid #00F0FF; border-radius: 6px; padding: 18px; margin-bottom: 20px; font-size: 14px; line-height: 1.65; color: #E2E8F0; white-space: pre-wrap;">${message}</div>

                    <!-- Telemetry & Edge Metadata -->
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 8px;">
                      Edge Telemetry Metadata
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0B1120; border: 1px solid #1E293B; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 12px 16px; font-size: 12px; color: #94A3B8;">
                          <div style="margin-bottom: 4px;"><strong>Timestamp:</strong> <span style="color: #F8FAFC;">${submittedAt}</span></div>
                          <div style="margin-bottom: 4px;"><strong>Client Location:</strong> <span style="color: #F8FAFC;">${clientCountry}${clientCity ? ' &bull; ' + clientCity : ''} (IP: ${clientIp})</span></div>
                          <div><strong>Cloudflare Ray ID:</strong> <span style="color: #00F0FF; font-family: monospace;">${rayId}</span></div>
                        </td>
                      </tr>
                    </table>

                    <!-- Action Buttons -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="left">
                          <a href="mailto:${email}?subject=Re:%20Inquiry%20regarding%20GTMObserver" style="display: inline-block; background-color: #00F0FF; color: #050B14; font-size: 13px; font-weight: 700; padding: 12px 22px; border-radius: 6px; text-decoration: none; margin-right: 10px;">
                            Reply to ${name} &rarr;
                          </a>
                          <a href="https://app.gtmobserver.com" style="display: inline-block; background-color: #1E293B; color: #FFFFFF; font-size: 13px; font-weight: 600; padding: 12px 20px; border-radius: 6px; text-decoration: none; border: 1px solid #334155;">
                            Open Dashboard
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

    // 2. Customer Confirmation Autoresponder Email Template
    const customerHtml = `
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
        <!-- Preheader -->
        <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 0px; line-height: 0px; max-width: 0px; opacity: 0;">
          We have received your message regarding GTMObserver. Our engineering team will review it shortly.
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #030712; margin: 0; padding: 24px 12px; width: 100%;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #0F172A; border: 1px solid #1E293B; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.5);">
                
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%); padding: 28px 24px; text-align: left; border-bottom: 1px solid #1E293B;">
                    <img src="https://gtmobserver.com/gtmobserver-logo.webp" alt="GTMObserver" height="36" style="display: block; border: 0; margin-bottom: 14px;" />
                    <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.12); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px;">
                      ✔ INQUIRY RECEIVED
                    </span>
                    <h1 style="margin: 12px 0 0 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em;">We've Received Your Message</h1>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #94A3B8;">GTMObserver Engineering & Telemetry Architecture</p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 24px 20px;">
                    <p style="font-size: 15px; color: #E2E8F0; margin: 0 0 14px 0; line-height: 1.6;">
                      Hi <strong>${name}</strong>,
                    </p>
                    <p style="font-size: 14px; color: #94A3B8; margin: 0 0 18px 0; line-height: 1.6;">
                      Thank you for contacting the GTMObserver engineering team. We have received your inquiry and our tracking architects will review your project requirements. One of our engineers will follow up with you within <strong>2 to 4 business hours</strong>.
                    </p>

                    <!-- Summary Box -->
                    <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 8px;">
                      Your Submitted Inquiry:
                    </div>
                    <div style="background-color: #090D16; border: 1px solid #1E293B; border-left: 3px solid #10B981; border-radius: 6px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; color: #CBD5E1; white-space: pre-wrap;">${message}</div>

                    <!-- Free Resource Download Card -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #131E32 0%, #172554 100%); border: 1px solid #1E40AF; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 18px 20px;">
                          <div style="font-size: 12px; text-transform: uppercase; color: #38BDF8; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 4px;">
                            Free Architecture Asset
                          </div>
                          <div style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin-bottom: 6px;">
                            GTMObserver Tracking Architecture Blueprint (PDF)
                          </div>
                          <p style="font-size: 13px; color: #94A3B8; margin: 0 0 14px 0; line-height: 1.5;">
                            Explore our comprehensive blueprint covering edge data layers, server-side GA4 pipelines, and anomaly detection rules.
                          </p>
                          <a href="https://gtmobserver.com/GTMObserver-Tracking-Architecture-Blueprint.pdf" target="_blank" style="display: inline-block; background-color: #00F0FF; color: #050B14; font-size: 12px; font-weight: 800; padding: 10px 18px; border-radius: 6px; text-decoration: none;">
                            📥 Download Free Blueprint PDF &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 13px; color: #64748B; margin: 0; line-height: 1.5;">
                      Need immediate assistance? Feel free to reply directly to this email or visit our <a href="https://gtmobserver.com" style="color: #00F0FF; text-decoration: none;">platform documentation</a>.
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

    // Send Admin Notification Email via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GTMObserver Contact <alerts@gtmobserver.com>',
        to: ['ovi.cse23@gmail.com'],
        reply_to: email,
        subject: `⚡ New Contact Request from ${name}`,
        html: adminHtml
      })
    });

    const resendData: any = await resendRes.json().catch(() => ({}));

    if (!resendRes.ok) {
      console.error('Resend Contact Error:', resendData);
      return new Response(JSON.stringify({ 
        error: { message: resendData.message || 'Failed to dispatch email via Resend' } 
      }), { 
        status: resendRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send Customer Confirmation Autoresponder Email (Non-blocking)
    const sendAutoresponder = async () => {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'GTMObserver Support <alerts@gtmobserver.com>',
            to: [email],
            subject: `We've received your inquiry — GTMObserver Engineering`,
            html: customerHtml
          })
        });
      } catch (e) {
        console.warn('Customer confirmation dispatch failed:', e);
      }
    };

    if (waitUntil) {
      waitUntil(sendAutoresponder());
    } else {
      sendAutoresponder();
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Contact handler exception:', err);
    return new Response(JSON.stringify({ 
      error: { message: err.message || 'Internal server error' } 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
