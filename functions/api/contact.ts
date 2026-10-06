export async function onRequest(context) {
  const { request } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const payload = {
      personalizations: [
        {
          to: [{ email: 'ovi.cse23@gmail.com', name: 'Ovi' }]
        }
      ],
      from: {
        email: 'no-reply@gtm-automation-saas.pages.dev',
        name: 'GTM Auto Contact Form'
      },
      reply_to: {
        email: email,
        name: name
      },
      subject: `New Inquiry from ${name}`,
      content: [
        {
          type: 'text/plain',
          value: `You have received a new message from your website contact form:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
        }
      ]
    };

    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mailchannels Error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
