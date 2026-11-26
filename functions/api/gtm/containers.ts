import { getGoogleAccessToken } from './_utils';
import { isValidGtmAccountId } from '../_security';

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const accountId = (url.searchParams.get('accountId') || '').trim();

  if (!isValidGtmAccountId(accountId)) {
    return new Response(JSON.stringify({ error: 'Valid numeric accountId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const accessToken = await getGoogleAccessToken(env, request);

    const response = await fetch(`https://tagmanager.googleapis.com/tagmanager/v2/accounts/${accountId}/containers`, {
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
