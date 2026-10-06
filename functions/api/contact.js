export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const { name, email, message } = data;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #030308; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px 0; background-color: #121212; border: 1px solid rgba(0, 240, 255, 0.2); border-radius: 12px; overflow: hidden; }
        .header { padding: 32px 24px 0 24px; text-align: left; }
        .logo { font-size: 28px; font-weight: 800; letter-spacing: -1px; color: #ffffff; margin: 0; text-decoration: none; }
        .logo span { color: #00F0FF; }
        .content { padding: 32px 24px; }
        h2 { font-size: 20px; color: #ffffff; margin-top: 0; }
        p { font-size: 15px; color: #A1A1AA; line-height: 1.6; }
        .data-box { background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-top: 24px; }
        .data-row { margin-bottom: 16px; }
        .data-row:last-child { margin-bottom: 0; }
        .data-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #9CA3AF; font-weight: 600; margin-bottom: 4px; display: block; }
        .data-value { font-size: 15px; color: #ffffff; margin: 0; white-space: pre-wrap; }
        .footer { text-align: center; padding: 24px; font-size: 13px; color: #6B7280; border-top: 1px solid rgba(255,255,255,0.05); }
      </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div><img src="https://gtm-automation-saas.pages.dev/gtmauto-logo.webp" alt="GTMAuto Logo" height="40" style="display: block; margin: 0; border: 0;" /></div>
          </div>
          <div class="content">
            <h2>New Contact Request</h2>
            <p>You have received a new message from the GTMAuto platform contact form.</p>
            <div class="data-box">
              <div class="data-row">
                <span class="data-label">Full Name</span>
                <p class="data-value">${name || 'N/A'}</p>
              </div>
              <div class="data-row">
                <span class="data-label">Email Address</span>
                <p class="data-value"><a href="mailto:${email}" style="color: #00F0FF; text-decoration: none;">${email || 'N/A'}</a></p>
              </div>
              <div class="data-row">
                <span class="data-label">Message</span>
                <p class="data-value">${message || 'N/A'}</p>
              </div>
            </div>
          </div>
          <div class="footer">
            Automated via GTMAuto Edge-Native Platform
          </div>
        </div>
      </body>
      </html>
    `;

    if (!env.RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Resend API Key in environment variables' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GTMAuto Platform <onboarding@resend.dev>',
        to: ['ovi.cse23@gmail.com'],
        subject: `New Contact Request from ${name || 'User'}`,
        html: html
      })
    });

    const resendData = await res.json();
    
    if (res.ok) {
      return new Response(JSON.stringify({ success: true, data: resendData }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ error: resendData }), { status: res.status, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
