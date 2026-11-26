import { checkRateLimit, escapeHtml, isValidEmail } from './_security';

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;

  try {
    const clientIp = request.headers.get('cf-connecting-ip') || 'unknown';
    const rate = await checkRateLimit(env.DB, 'newsletter', clientIp, 5, 600);
    if (!rate.allowed) {
      return new Response(
        JSON.stringify({ error: { message: 'Too many requests. Please try again in a few minutes.' } }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '600' }
        }
      );
    }

    const data = await request.json().catch(() => ({}));
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: { message: 'Please provide a valid email address.' } }),
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

    const safeEmail = escapeHtml(email);
    const safeIp = escapeHtml(clientIp);
    const clientCountry = escapeHtml(request.headers.get('cf-ipcountry') || 'Global');
    const clientCity = escapeHtml(request.headers.get('cf-ipcity') || '');
    const subscribedAt =
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
        <title>New Subscriber</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
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
                    <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0F172A;">New newsletter subscriber</h1>
                    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.5; color: #475569;">A new user just subscribed to the GTMObserver newsletter:</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 28px;">
                      <tr>
                        <td style="padding: 18px 20px;">
                          <div style="font-size: 14px; margin-bottom: 6px;"><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color: #0284C7; text-decoration: none;">${safeEmail}</a></div>
                          <div style="font-size: 14px; margin-bottom: 6px;"><strong>Source:</strong> Website Footer Form (gtmobserver.com)</div>
                          <div style="font-size: 14px;"><strong>Date:</strong> ${subscribedAt}</div>
                        </td>
                      </tr>
                    </table>
                    <a href="https://app.gtmobserver.com" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px;">
                      Open Dashboard &rarr;
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

    const subscriberHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to GTMObserver Insider</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
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
                    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0F172A;">Welcome to GTMObserver Insider</h1>
                    <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #334155;">Hi there,</p>
                    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                      Thanks for subscribing! Every couple of weeks, we send practical tips on automated Google Tag Manager setups, Cloudflare edge analytics, and real-time GA4 anomaly detection.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px;">
                          <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 6px;">Your Free Gift: Tracking Architecture Blueprint</div>
                          <a href="https://gtmobserver.com/GTMObserver-Tracking-Architecture-Blueprint.pdf" target="_blank" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-size: 13px; font-weight: 600; text-decoration: none; padding: 11px 20px; border-radius: 6px;">
                            Download Blueprint (PDF) &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
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

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GTMObserver <info@gtmobserver.com>',
        to: ['ovi@razibmarketing.net'],
        reply_to: email,
        subject: `New newsletter subscriber: ${email.replace(/[\r\n]/g, '')}`,
        html: adminHtml
      })
    });

    const resendData = await res.json().catch(() => ({}));
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: { message: resendData.message || 'Failed to dispatch newsletter subscription' } }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sendWelcome = async () => {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'GTMObserver Team <info@gtmobserver.com>',
            to: [email],
            reply_to: 'info@gtmobserver.com',
            subject: 'Welcome to GTMObserver Insider',
            html: subscriberHtml
          })
        });
      } catch (_) {}
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
    return new Response(JSON.stringify({ error: { message: 'Internal server error' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
