export async function onRequestPost(context) {
  const { request, env } = context;
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

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0b0f19; margin: 0; padding: 0; color: #ffffff; }
          .container { max-width: 600px; margin: 30px auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #111827 0%, #1e1b4b 100%); padding: 28px 24px; text-align: left; border-bottom: 1px solid #1f2937; }
          .title { font-size: 20px; font-weight: 800; color: #00F0FF; margin: 0; }
          .subtitle { font-size: 13px; color: #9ca3af; margin-top: 4px; }
          .body { padding: 28px 24px; }
          .card { background-color: #1a2234; border: 1px solid #2d3748; border-radius: 8px; padding: 18px 20px; }
          .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 4px; }
          .value { font-size: 16px; color: #00F0FF; font-weight: 600; margin: 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #64748b; border-top: 1px solid #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">GTMObserver</h1>
            <p class="subtitle">New Newsletter Subscription Alert</p>
          </div>
          <div class="body">
            <p style="font-size: 15px; color: #e2e8f0; margin-top: 0;">A new user has subscribed to the GTMObserver platform newsletter:</p>
            <div class="card">
              <div class="label">Subscriber Email</div>
              <p class="value"><a href="mailto:${email}" style="color: #00F0FF; text-decoration: none;">${email}</a></p>
            </div>
          </div>
          <div class="footer">
            Delivered via GTMObserver Edge Architecture &bull; <a href="https://gtmobserver.com" style="color: #64748b; text-decoration: none;">gtmobserver.com</a>
          </div>
        </div>
      </body>
      </html>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'GTMObserver <alerts@gtmobserver.com>',
        to: ['ovi.cse23@gmail.com'],
        subject: `New Newsletter Subscriber: ${email}`,
        html: html
      })
    });

    const resendData = await res.json().catch(() => ({}));
    
    if (res.ok) {
      return new Response(JSON.stringify({ success: true, id: resendData.id }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    } else {
      console.error('Newsletter Resend Error:', resendData);
      return new Response(JSON.stringify({ error: { message: resendData.message || 'Failed to dispatch newsletter subscription' } }), { 
        status: res.status, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

  } catch (err) {
    console.error('Newsletter handler exception:', err);
    return new Response(JSON.stringify({ error: { message: err.message || 'Internal server error' } }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
