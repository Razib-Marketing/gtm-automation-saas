import { getGoogleAccessToken } from './_utils';

export async function onRequest(context) {
  const { env, request } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const containerPath = url.searchParams.get('containerPath');

    if (!containerPath) {
      return new Response(JSON.stringify({ error: 'Missing containerPath' }), { status: 400 });
    }

    const accessToken = await getGoogleAccessToken(env, request);

    // Fetch Tags
    const tagsRes = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/tags`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    // Fetch Triggers
    const triggersRes = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/triggers`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    // Fetch Variables
    const variablesRes = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/${containerPath}/variables`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const tagsData = await tagsRes.json();
    const triggersData = await triggersRes.json();
    const variablesData = await variablesRes.json();

    if (!tagsRes.ok) {
      return new Response(JSON.stringify({ error: tagsData.error?.message || 'Failed to fetch tags' }), { status: 500 });
    }

    return new Response(JSON.stringify({
      tags: tagsData.tag || [],
      triggers: triggersData.trigger || [],
      variables: variablesData.variable || []
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
