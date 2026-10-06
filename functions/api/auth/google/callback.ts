export async function onRequest(context) {
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
        grant_type: 'authorization_code',
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange token: ${JSON.stringify(tokenData)}`);
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // 2. Fetch User Profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      throw new Error(`Failed to fetch profile: ${JSON.stringify(profileData)}`);
    }

    const clerkUserId = url.searchParams.get('state') || 'unknown';

    // 3. Save to D1 Database
    const connectionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    // Cleanup any corrupted rows from previous bugs
    await env.DB.prepare("DELETE FROM users WHERE id = 'undefined'").run();
    // Also delete any old row with the same email but different ID (e.g. if they deleted Clerk account)
    await env.DB.prepare("DELETE FROM users WHERE email = ? AND id != ?").bind(profileData.email, clerkUserId).run();
    // Delete old GTM connections for this user so we don't accidentally use an old token
    await env.DB.prepare("DELETE FROM gtm_connections WHERE user_id = ?").bind(clerkUserId).run();

    // UPSERT user record using clerkUserId to satisfy foreign key constraints
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

    // 4. Redirect to Dashboard with a success flag
    return Response.redirect(`${url.origin}/dashboard?auth=success`, 302);

  } catch (error) {
    return new Response(`Authentication Error: ${error.message}`, { status: 500 });
  }
}
