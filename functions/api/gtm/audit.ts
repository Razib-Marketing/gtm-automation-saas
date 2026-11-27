import { getGoogleAccessToken, extractClerkUserId } from './_utils';
import { isValidGtmWorkspacePath, isUnlimitedAdminEmail, verifyClerkAuth } from '../_security';

export async function onRequest(context) {
  const { env, request } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const containerPath = (url.searchParams.get('containerPath') || '').trim();

    if (!isValidGtmWorkspacePath(containerPath)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid GTM workspace path' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const auth = await verifyClerkAuth(request, env);
    const clerkUserId = auth?.userId || (await extractClerkUserId(request, env));
    const userRow: any = await env.DB.prepare(
      'SELECT email, subscription_tier FROM users WHERE id = ?'
    ).bind(clerkUserId).first();

    const isAdmin = isUnlimitedAdminEmail(auth?.email) || isUnlimitedAdminEmail(userRow?.email);
    const tier = isAdmin ? 'custom' : (userRow?.subscription_tier || 'free');
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

    const tagsData: any = await tagsRes.json();
    const triggersData: any = await triggersRes.json();
    const variablesData: any = await variablesRes.json();

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
