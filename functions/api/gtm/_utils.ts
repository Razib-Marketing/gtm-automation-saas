import { verifyClerkAuth, ClerkAuthContext } from '../_security';

export async function requireClerkAuth(request: Request, env?: any): Promise<ClerkAuthContext> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing Clerk Authorization header. Please sign in or refresh your session.');
  }

  const verified = await verifyClerkAuth(request, env);
  if (!verified || !verified.userId) {
    throw new Error('Invalid or expired Clerk authentication token. Please sign in again.');
  }
  return verified;
}

export async function extractClerkUserId(request: Request, env?: any): Promise<string> {
  const auth = await requireClerkAuth(request, env);
  return auth.userId;
}

export async function getGoogleAccessToken(
  env: any,
  request: Request,
  fallbackOwnerUserId?: string | null
) {
  const clerkUserId = await extractClerkUserId(request, env);

  let dbResult = await env.DB.prepare(`
    SELECT encrypted_refresh_token 
    FROM gtm_connections 
    WHERE user_id = ? 
    ORDER BY created_at DESC LIMIT 1
  `).bind(clerkUserId).first();

  if (
    (!dbResult || !dbResult.encrypted_refresh_token || dbResult.encrypted_refresh_token === 'no_refresh_token_provided') &&
    fallbackOwnerUserId &&
    fallbackOwnerUserId !== clerkUserId
  ) {
    dbResult = await env.DB.prepare(`
      SELECT encrypted_refresh_token 
      FROM gtm_connections 
      WHERE user_id = ? 
      ORDER BY created_at DESC LIMIT 1
    `).bind(fallbackOwnerUserId).first();
  }

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
