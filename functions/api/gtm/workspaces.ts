import { getGoogleAccessToken } from './_utils';

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const containerPath = url.searchParams.get('containerPath');

  if (!containerPath) {
    return new Response(JSON.stringify({ error: 'containerPath is required' }), { status: 400 });
  }

  try {
    const accessToken = await getGoogleAccessToken(env, request);

    const response = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/workspaces`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), { 
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
