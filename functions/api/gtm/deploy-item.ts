import { getGoogleAccessToken } from './_utils';

export async function onRequest(context) {
  const { env, request } = context;

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { type, containerPath, payload } = await request.json();

    if (!type || !containerPath || !payload) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const accessToken = await getGoogleAccessToken(env, request);
    const apiHeaders = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    let url = '';
    if (type === 'variable') url = `https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/variables`;
    else if (type === 'trigger') url = `https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/triggers`;
    else if (type === 'tag') url = `https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/tags`;
    else return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });

    const res = await fetch(url, {
      method: 'POST', 
      headers: apiHeaders, 
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // 400 with "already exists" is considered a success for variables/triggers/tags that are duplicated across modules
      if (data.error?.message?.includes("already exists")) {
        return new Response(JSON.stringify({ success: true, message: 'Already exists', data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ error: data.error?.message || 'Deploy failed', details: data }), { status: res.status, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, data }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    console.error("Internal Server Error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
