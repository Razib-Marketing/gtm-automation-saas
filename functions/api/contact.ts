import { checkRateLimit, escapeHtml, isValidEmail } from './_security';

export async function onRequestPost(context: any) {
  const { request, env, waitUntil } = context;

  try {
    const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
    const rate = await checkRateLimit(env.DB, 'contact', clientIp, 5, 600);
    if (!rate.allowed) {
      return new Response(
        JSON.stringify({ error: { message: 'Too many requests. Please try again in a few minutes.' } }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '600' }
        }
      );
    }

    const data: any = await request.json().catch(() => ({}));
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    const message = typeof data.message === 'string' ? data.message.trim() : '';

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: { message: 'Please fill in all required fields (Name, Email, and Message).' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (name.length > 120 || !isValidEmail(email) || message.length > 4000) {
      return new Response(
        JSON.stringify({ error: { message: 'Invalid field format or input exceeds maximum allowed length.' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = env.RESEND_API_KEY;
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: { message: 'Email service is not configured.' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);
    const safeIp = escapeHtml(clientIp);
    const clientCountry = escapeHtml(request.headers.get('cf-ipcountry') || 'Global');
    const clientCity = escapeHtml(request.headers.get('cf-ipcity') || '');
    const submittedAt =
      new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
        dateStyle: 'medium',
        timeStyle: 'short'
      }) + ' UTC';

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
          New message from ${safeName} (${safeEmail}) via gtmobserver.com contact form
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 580px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); text-align: left;">
                <tr>
                  <td style="background-color: #0F172A; padding: 24px 32px; border-bottom: 2px solid #00E5FF;">
                    <a href="https://gtmobserver.com" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="https://gtmobserver.com/gtmobserver-logo.png" alt="GTMObserver" width="190" height="35" border="0" style="display: block; width: 190px; height: 35px; border: 0; font-size: 20px; font-weight: 800; color: #00E5FF;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 32px 28px 32px;">
                    <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0F172A;">New contact form submission</h1>
                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.5; color: #475569;">
                      You received a new message through the contact form on <a href="https://gtmobserver.com" style="color: #0284C7; text-decoration: none;">gtmobserver.com</a>:
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px;">
                                <span style="color: #64748B; font-weight: 500; display: inline-block; width: 80px;">Name:</span>
                                <strong style="color: #0F172A; font-weight: 600;">${safeName}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 4px 0; font-size: 14px;">
                                <span style="color: #64748B; font-weight: 500; display: inline-block; width: 80px;">Email:</span>
                                <a href="mailto:${safeEmail}" style="color: #0284C7; text-decoration: none; font-weight: 600;">${safeEmail}</a>
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
                    <div style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Message</div>
                    <div style="background-color: #FFFFFF; border: 1px solid #CBD5E1; border-left: 3px solid #00E5FF; border-radius: 6px; padding: 18px 20px; font-size: 15px; line-height: 1.6; color: #1E293B; margin-bottom: 28px; white-space: pre-wrap;">${safeMessage}</div>
                    <a href="mailto:${safeEmail}?subject=Re:%20Inquiry%20regarding%20GTMObserver" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                      Reply to ${safeName} &rarr;
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; text-align: center;">
                    Sent via GTMObserver &bull; IP: ${safeIp}${clientCity ? ' &bull; ' + clientCity : ''} &bull; Location: ${clientCountry}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const customerHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>We received your message</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 580px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; text-align: left;">
                <tr>
                  <td style="background-color: #0F172A; padding: 24px 32px; border-bottom: 2px solid #00E5FF;">
                    <a href="https://gtmobserver.com" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="https://gtmobserver.com/gtmobserver-logo.png" alt="GTMObserver" width="190" height="35" border="0" style="display: block; width: 190px; height: 35px; border: 0; font-size: 20px; font-weight: 800; color: #00E5FF;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 32px 28px 32px;">
                    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0F172A;">We received your message</h1>
                    <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">Hi <strong>${safeName}</strong>,</p>
                    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                      Thanks for reaching out to GTMObserver! We've received your note and a member of our engineering team will get back to you shortly (typically within 2 to 4 business hours).
                    </p>
                    <div style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 8px;">Your message:</div>
                    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 3px solid #00E5FF; border-radius: 6px; padding: 16px 18px; font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; white-space: pre-wrap;">${safeMessage}</div>
                    <p style="margin: 0; font-size: 14px; color: #64748B;">Best regards,<br><strong style="color: #0F172A;">The GTMObserver Team</strong></p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8; text-align: center;">
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

    const cleanSubjectName = name.replace(/[\r\n]/g, ' ');
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GTMObserver Contact <contact@gtmobserver.com>',
        to: ['ovi@razibmarketing.net'],
        reply_to: email,
        subject: `New inquiry from ${cleanSubjectName}`,
        html: adminHtml
      })
    });

    const resendData: any = await resendRes.json().catch(() => ({}));
    if (!resendRes.ok) {
      return new Response(
        JSON.stringify({ error: { message: resendData.message || 'Failed to dispatch email via Resend' } }),
        { status: resendRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sendAutoresponder = async () => {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'GTMObserver Contact <contact@gtmobserver.com>',
            to: [email],
            reply_to: 'contact@gtmobserver.com',
            subject: 'We received your message – GTMObserver',
            html: customerHtml
          })
        });
      } catch (_) {}
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
    return new Response(JSON.stringify({ error: { message: 'Internal server error' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
