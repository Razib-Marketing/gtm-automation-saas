export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const scope = 'https://www.googleapis.com/auth/tagmanager.edit.containers https://www.googleapis.com/auth/tagmanager.manage.accounts https://www.googleapis.com/auth/tagmanager.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/analytics.readonly';
  
  const clerkUserId = url.searchParams.get('clerkUserId') || 'unknown';
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent'); // Force consent to ensure we get a refresh token
  authUrl.searchParams.set('state', clerkUserId);

  return Response.redirect(authUrl.toString(), 302);
}
