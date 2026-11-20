import { getGoogleAccessToken, extractClerkUserId } from './_utils';

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

    // Check user subscription tier and 5-audit limit for free users
    try {
      const clerkUserId = extractClerkUserId(request);
      const userRow: any = await env.DB.prepare(
        'SELECT subscription_tier FROM users WHERE id = ?'
      ).bind(clerkUserId).first();

      const tier = userRow?.subscription_tier || 'free';
      if (tier === 'free') {
        const auditCountRow: any = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM audit_logs WHERE user_id = ?'
        ).bind(clerkUserId).first();

        const count = auditCountRow?.count || 0;
        if (count >= 5) {
          return new Response(JSON.stringify({ 
            error: 'Free tier limit reached. You have used all 5 free GTM workspace audits. Please contact support to continue auditing workspaces.' 
          }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
      }
    } catch (authCheckErr: any) {
      if (authCheckErr.message && authCheckErr.message.includes('limit reached')) {
        throw authCheckErr;
      }
      // If clerk auth header is missing or optional, proceed to getGoogleAccessToken which handles error
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
