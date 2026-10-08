function getClerkUserId(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    let payloadBase64 = token.split('.')[1];
    payloadBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    while (payloadBase64.length % 4) {
      payloadBase64 += '=';
    }
    const payload = JSON.parse(atob(payloadBase64));
    return payload.sub;
  } catch (e) {
    return null;
  }
}

export async function onRequest(context: any) {
  const { env, request } = context;
  const userId = getClerkUserId(request);

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const resendApiKey = env.RESEND_API_KEY;

  // GET: Fetch current domain status on Resend
  if (request.method === 'GET') {
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${resendApiKey}` }
      });
      const data: any = await res.json();
      
      let domain = data.data?.find((d: any) => d.status === 'verified') || data.data?.[0];

      if (domain) {
        // Fetch full domain details including records
        const detailRes = await fetch(`https://api.resend.com/domains/${domain.id}`, {
          headers: { 'Authorization': `Bearer ${resendApiKey}` }
        });
        if (detailRes.ok) {
          domain = await detailRes.json();
        }
      }

      return new Response(JSON.stringify({
        success: true,
        domain,
        isVerified: domain.status === 'verified',
        senderEmail: domain.status === 'verified' ? `alerts@${domain.name}` : 'onboarding@resend.dev'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // POST: Trigger DNS re-verification on Resend
  if (request.method === 'POST') {
    try {
      const body = await request.json().catch(() => ({}));
      const domainId = body.domainId || '6aab0c94-6a3b-44db-975a-c008300fbda3';

      await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey}` }
      });

      // Fetch fresh status
      const detailRes = await fetch(`https://api.resend.com/domains/${domainId}`, {
        headers: { 'Authorization': `Bearer ${resendApiKey}` }
      });
      const domain: any = await detailRes.json();

      return new Response(JSON.stringify({
        success: true,
        domain,
        isVerified: domain.status === 'verified',
        senderEmail: domain.status === 'verified' ? `alerts@${domain.name}` : 'onboarding@resend.dev'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
