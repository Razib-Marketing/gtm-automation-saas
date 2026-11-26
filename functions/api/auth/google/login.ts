import { isSafeReturnPath, signOAuthState, verifyClerkAuth } from '../../_security';

export async function onRequest(context: any) {
  const { env, request } = context;

  // Reject unauthenticated GET redirects so attackers cannot forge clerkUserId in OAuth state
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Initiate Google OAuth via authenticated POST /api/auth/google/login.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const auth = await verifyClerkAuth(request, env);
  if (!auth || !auth.userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: 'Google OAuth credentials are not configured.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body: any = await request.json().catch(() => ({}));
  const rawReturnTo = typeof body?.returnTo === 'string' ? body.returnTo : '/organization';
  const safeReturnTo = isSafeReturnPath(rawReturnTo) ? rawReturnTo : '/organization';

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const scope =
    'https://www.googleapis.com/auth/tagmanager.edit.containers https://www.googleapis.com/auth/tagmanager.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/analytics.readonly';

  const nonce = crypto.randomUUID();
  const signedState = await signOAuthState(
    { clerkUserId: auth.userId, returnTo: safeReturnTo, nonce },
    clientSecret
  );

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', signedState);

  const isSecure = url.protocol === 'https:';
  const cookieParts = [
    `gtm_oauth_nonce=${encodeURIComponent(nonce)}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/api/auth/google',
    'Max-Age=600'
  ];
  if (isSecure) cookieParts.push('Secure');

  return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieParts.join('; ')
    }
  });
}
