function decodeOAuthState(rawState: string | null): { clerkUserId: string; returnTo: string } {
  if (!rawState) {
    return { clerkUserId: 'unknown', returnTo: '/organization' };
  }
  try {
    let b64 = rawState.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const decoded = atob(b64);
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.clerkUserId === 'string') {
      const rt = typeof parsed.returnTo === 'string' && parsed.returnTo.startsWith('/') && !parsed.returnTo.startsWith('//')
        ? parsed.returnTo
        : '/organization';
      return { clerkUserId: parsed.clerkUserId || 'unknown', returnTo: rt };
    }
  } catch (_) {}
  return { clerkUserId: rawState, returnTo: '/organization' };
}

export async function onRequest(context: any) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('No authorization code provided', { status: 400 });
  }

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  try {
    // 1. Exchange code for tokens
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
      throw new Error(`Failed to exchange token: ${JSON.stringify(tokenData)}`);
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // 2. Fetch User Profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const profileData: any = await profileResponse.json();

    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch profile: ${JSON.stringify(profileData)}`);
    }

    const { clerkUserId, returnTo } = decodeOAuthState(url.searchParams.get('state'));

    // 3. Save to D1 Database
    const connectionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    await env.DB.prepare("DELETE FROM users WHERE id = 'undefined'").run();
    await env.DB.prepare('DELETE FROM users WHERE email = ? AND id != ?').bind(profileData.email, clerkUserId).run();
    await env.DB.prepare('DELETE FROM gtm_connections WHERE user_id = ?').bind(clerkUserId).run();

    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO users (id, email, name, subscription_tier)
        VALUES (?, ?, ?, 'free')
        ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name
      `).bind(clerkUserId, profileData.email, profileData.name),

      env.DB.prepare(`
        INSERT INTO gtm_connections (id, user_id, account_id, container_id, encrypted_refresh_token, token_expires_at)
        VALUES (?, ?, 'pending', 'pending', ?, ?)
      `).bind(connectionId, clerkUserId, refresh_token || 'no_refresh_token_provided', expiresAt)
    ]);

    // 4. Redirect cleanly back to requested app view (e.g., /onboarding or /organization)
    const separator = returnTo.includes('?') ? '&' : '?';
    return Response.redirect(`${url.origin}${returnTo}${separator}auth=success`, 302);
  } catch (error: any) {
    return new Response(`Authentication Error: ${error.message}`, { status: 500 });
  }
}
