import { getGoogleAccessToken } from '../gtm/_utils';

export async function onRequest(context: any) {
  const { env, request } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const accessToken = await getGoogleAccessToken(env, request);

    // Fetch GA4 Account Summaries using Analytics Admin API
    const response = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const data = await response.json();
    
    if (!response.ok) {
        return new Response(JSON.stringify({ 
          error: data.error?.message || `Failed to fetch GA4 properties from Google (${response.status})` 
        }), { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    // Flatten properties from all accounts
    const allProperties: any[] = [];
    if (data.accountSummaries) {
      for (const account of data.accountSummaries) {
        if (account.propertySummaries) {
          for (const prop of account.propertySummaries) {
            allProperties.push({
              name: prop.property,
              displayName: `${account.displayName} > ${prop.displayName}`,
              parent: account.name
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ properties: allProperties }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
