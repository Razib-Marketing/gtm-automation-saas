export async function onRequest(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);

  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const scope =
    'https://www.googleapis.com/auth/tagmanager.edit.containers https://www.googleapis.com/auth/tagmanager.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/analytics.readonly';

  const clerkUserId = url.searchParams.get('clerkUserId') || 'unknown';
  const rawReturnTo = url.searchParams.get('returnTo') || '/organization';
  const safeReturnTo =
    rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
      ? rawReturnTo
      : '/organization';

  const statePayload = JSON.stringify({ clerkUserId, returnTo: safeReturnTo });
  const encodedState = btoa(statePayload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent'); // Force consent to ensure we get a refresh token
  authUrl.searchParams.set('state', encodedState);

  return Response.redirect(authUrl.toString(), 302);
}
