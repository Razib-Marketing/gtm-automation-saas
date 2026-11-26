import { verifyOAuthState } from '../../_security';

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(';');
  for (const part of pairs) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    if (k === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

export async function onRequest(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const rawState = url.searchParams.get('state');

  if (!code) {
    return new Response('No authorization code provided', { status: 400 });
  }

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response('Google OAuth is not configured', { status: 503 });
  }

  const cookieNonce = parseCookie(request.headers.get('Cookie'), 'gtm_oauth_nonce');
  if (!cookieNonce) {
    return new Response(
      'Missing OAuth CSRF verification cookie. Please restart Google connection from your dashboard.',
      { status: 403 }
    );
  }

  const verifiedState = await verifyOAuthState(rawState, clientSecret, cookieNonce);
  if (!verifiedState) {
    return new Response(
      'Invalid or expired OAuth state signature. Please restart Google connection from your dashboard.',
      { status: 403 }
    );
  }

  const { clerkUserId, returnTo } = verifiedState;
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData: any = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange Google authorization code');
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const profileData: any = await profileResponse.json();
    if (!profileResponse.ok) {
      throw new Error('Failed to fetch Google user profile');
    }

    const connectionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + (Number(expires_in) || 3600) * 1000).toISOString();

    await env.DB.prepare('DELETE FROM gtm_connections WHERE user_id = ?').bind(clerkUserId).run();

    // Preserve existing user subscription_tier; never delete other user rows by email!
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO users (id, email, name, subscription_tier)
        VALUES (?, ?, ?, 'free')
        ON CONFLICT(id) DO UPDATE SET
          email = CASE WHEN users.email IS NULL OR users.email = 'unknown@example.com' THEN excluded.email ELSE users.email END,
          name = COALESCE(excluded.name, users.name)
      `).bind(clerkUserId, profileData.email || 'unknown@example.com', profileData.name || ''),

      env.DB.prepare(`
        INSERT INTO gtm_connections (id, user_id, account_id, container_id, encrypted_refresh_token, token_expires_at)
        VALUES (?, ?, 'pending', 'pending', ?, ?)
      `).bind(connectionId, clerkUserId, refresh_token || 'no_refresh_token_provided', expiresAt)
    ]);

    const separator = returnTo.includes('?') ? '&' : '?';
    const isSecure = url.protocol === 'https:';
    const clearCookie = [
      'gtm_oauth_nonce=',
      'HttpOnly',
      'SameSite=Lax',
      'Path=/api/auth/google',
      'Max-Age=0',
      ...(isSecure ? ['Secure'] : [])
    ].join('; ');

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${url.origin}${returnTo}${separator}auth=success`,
        'Set-Cookie': clearCookie
      }
    });
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return new Response('Authentication failed. Please retry connecting your Google account.', {
      status: 500
    });
  }
}
