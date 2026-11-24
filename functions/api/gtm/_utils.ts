export function extractClerkUserId(request: Request): string {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing Clerk Authorization header. Please sign in or refresh your session.');
  }

  const token = authHeader.substring(7).trim();
  if (!token || token === 'null' || token === 'undefined') {
    throw new Error('Authentication token is missing or not yet loaded. Please refresh your session.');
  }

  const parts = token.split('.');
  if (parts.length < 2 || !parts[1]) {
    throw new Error('Malformed authentication token. Please re-authenticate.');
  }

  try {
    let payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payloadBase64.length % 4) {
      payloadBase64 += '=';
    }
    const payloadString = atob(payloadBase64);
    const payload = JSON.parse(payloadString);
    if (!payload.sub) {
      throw new Error('User ID not present in token');
    }
    return payload.sub;
  } catch (e: any) {
    throw new Error('Invalid Clerk token: ' + (e.message || 'Unable to decode'));
  }
}

export async function getGoogleAccessToken(env: any, request: Request) {
  const clerkUserId = extractClerkUserId(request);

  const dbResult = await env.DB.prepare(`
    SELECT encrypted_refresh_token 
    FROM gtm_connections 
    WHERE user_id = ? 
    ORDER BY created_at DESC LIMIT 1
  `).bind(clerkUserId).first();

  if (!dbResult || !dbResult.encrypted_refresh_token || dbResult.encrypted_refresh_token === 'no_refresh_token_provided') {
    throw new Error('Google account not connected or missing refresh token. Please re-authenticate Google on the Dashboard.');
  }

  const refreshToken = dbResult.encrypted_refresh_token;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    })
  });

  const tokenData: any = await tokenResponse.json();
  if (!tokenResponse.ok) {
    const detail = tokenData.error_description || tokenData.error || JSON.stringify(tokenData);
    throw new Error(`Failed to refresh Google token (${detail}). Please re-authenticate your Google account on the Dashboard.`);
  }

  return tokenData.access_token;
}
