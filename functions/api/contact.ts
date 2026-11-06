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
    const submittedAt = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short'
    }) + ' UTC';

    // 1. Human-Crafted Admin Notification Email Template
    const adminHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Inquiry</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
        <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 0px; line-height: 0px; max-width: 0px; opacity: 0;">
          New message from ${name} (${email}) via gtmobserver.com contact form
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
                    
                    <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0F172A; letter-spacing: -0.01em;">
                      New contact form submission
                    </h1>
                    
                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.5; color: #475569;">
                      You received a new message through the contact form on <a href="https://gtmobserver.com" style="color: #0284C7; text-decoration: none;">gtmobserver.com</a>:
                    </p>

                    <!-- Sender Details Card -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px;">
                                <span style="color: #64748B; font-weight: 500; display: inline-block; width: 80px;">Name:</span>
                                <strong style="color: #0F172A; font-weight: 600;">${name}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px;">
                                <span style="color: #64748B; font-weight: 500; display: inline-block; width: 80px;">Email:</span>
                                <a href="mailto:${email}" style="color: #0284C7; text-decoration: none; font-weight: 600;">${email}</a>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px;">
                                <span style="color: #64748B; font-weight: 500; display: inline-block; width: 80px;">Sent at:</span>
                                <span style="color: #334155;">${submittedAt}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Message Section -->
                    <div style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                      Message
                    </div>
                    <div style="background-color: #FFFFFF; border: 1px solid #CBD5E1; border-left: 3px solid #00E5FF; border-radius: 6px; padding: 18px 20px; font-size: 15px; line-height: 1.6; color: #1E293B; margin-bottom: 28px; white-space: pre-wrap;">${message}</div>

                    <!-- CTA Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <a href="mailto:${email}?subject=Re:%20Inquiry%20regarding%20GTMObserver" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                            Reply to ${name} &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Subtle Footer -->
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

    // 2. Human-Crafted Customer Confirmation Email Template
    const customerHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>We received your message</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
        
        <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 0px; line-height: 0px; max-width: 0px; opacity: 0;">
          We have received your message regarding GTMObserver. Our team will get back to you shortly.
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
                      We received your message
                    </h1>
                    
                    <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                      Hi <strong>${name}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                      Thanks for reaching out to GTMObserver! We've received your note and a member of our engineering team will get back to you shortly (typically within 2 to 4 business hours).
                    </p>

                    <!-- Message Copy -->
                    <div style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                      Your message:
                    </div>
                    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3px solid #00E5FF; border-radius: 6px; padding: 16px 18px; font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; white-space: pre-wrap;">${message}</div>

                    <!-- Helpful Resource Card -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 18px 20px;">
                          <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 6px;">
                            Free Resource: Tracking Architecture Blueprint
                          </div>
                          <p style="margin: 0 0 14px 0; font-size: 13px; line-height: 1.5; color: #64748B;">
                            While you wait, feel free to review our architecture blueprint covering edge data layers, server-side pipelines, and GA4 telemetry monitoring.
                          </p>
                          <a href="https://gtmobserver.com/GTMObserver-Tracking-Architecture-Blueprint.pdf" target="_blank" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 18px; border-radius: 6px;">
                            Download Blueprint (PDF) &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #64748B;">
                      If you have additional details to share, just reply directly to this email.<br>
                      <br>
                      Best regards,<br>
                      <strong style="color: #0F172A;">The GTMObserver Team</strong>
                    </p>

                  </td>
                </tr>

                <!-- Subtle Footer -->
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

    // Send Admin Notification Email via Resend directly (No file attachments)
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GTMObserver Contact <contact@gtmobserver.com>',
        to: ['ovi@razibmarketing.net'],
        reply_to: email,
        subject: `New inquiry from ${name}`,
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

    // Send Customer Confirmation Autoresponder Email (Non-blocking) directly
    const sendAutoresponder = async () => {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'GTMObserver Contact <contact@gtmobserver.com>',
            to: [email],
            reply_to: 'contact@gtmobserver.com',
            subject: `We received your message – GTMObserver`,
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
