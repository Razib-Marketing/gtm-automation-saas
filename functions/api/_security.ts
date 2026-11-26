export interface ClerkAuthContext {
  userId: string;
  orgId: string | null;
  orgRole: string | null;
  email: string | null;
}

const DEFAULT_CLERK_ISSUER = 'https://clerk.gtmobserver.com';
const JWKS_CACHE_TTL_MS = 10 * 60 * 1000;

interface JwksCacheEntry {
  url: string;
  fetchedAt: number;
  keysByKid: Map<string, JsonWebKey>;
  importedKeys: Map<string, CryptoKey>;
}

let jwksCache: JwksCacheEntry | null = null;

function base64UrlToUint8Array(input: string): Uint8Array {
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64UrlJson(input: string): any {
  const bytes = base64UrlToUint8Array(input);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text);
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const maxLen = Math.max(aBytes.length, bBytes.length, 1);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < maxLen; i++) {
    const ba = i < aBytes.length ? aBytes[i] : 0;
    const bb = i < bBytes.length ? bBytes[i] : 0;
    diff |= ba ^ bb;
  }
  return diff === 0;
}

async function fetchJwksKeys(jwksUrl: string, forceRefresh = false): Promise<JwksCacheEntry | null> {
  const now = Date.now();
  if (
    !forceRefresh &&
    jwksCache &&
    jwksCache.url === jwksUrl &&
    now - jwksCache.fetchedAt < JWKS_CACHE_TTL_MS
  ) {
    return jwksCache;
  }

  try {
    const res = await fetch(jwksUrl, {
      headers: { Accept: 'application/json' },
      cf: { cacheTtl: 300, cacheEverything: true }
    } as any);

    if (!res.ok) {
      return jwksCache;
    }

    const data: any = await res.json();
    const keys: any[] = Array.isArray(data?.keys) ? data.keys : [];
    const keysByKid = new Map<string, JsonWebKey>();
    for (const k of keys) {
      if (k && typeof k.kid === 'string' && k.kty === 'RSA') {
        keysByKid.set(k.kid, k as JsonWebKey);
      }
    }

    jwksCache = {
      url: jwksUrl,
      fetchedAt: now,
      keysByKid,
      importedKeys: new Map<string, CryptoKey>()
    };
    return jwksCache;
  } catch (err) {
    console.warn('Failed to fetch Clerk JWKS:', err);
    return jwksCache;
  }
}

async function getVerificationKey(jwksUrl: string, kid: string): Promise<CryptoKey | null> {
  let cache = await fetchJwksKeys(jwksUrl, false);
  let jwk = cache?.keysByKid.get(kid);

  if (!jwk) {
    // Key rotation fallback: force refresh once when an unknown kid arrives
    cache = await fetchJwksKeys(jwksUrl, true);
    jwk = cache?.keysByKid.get(kid);
  }

  if (!cache || !jwk) return null;

  const existing = cache.importedKeys.get(kid);
  if (existing) return existing;

  try {
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    cache.importedKeys.set(kid, cryptoKey);
    return cryptoKey;
  } catch (err) {
    console.warn('Failed to import Clerk JWK:', err);
    return null;
  }
}

export async function verifyClerkAuth(
  request: Request,
  env?: any
): Promise<ClerkAuthContext | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7).trim();
  if (!token || token === 'null' || token === 'undefined') return null;

  const parts = token.split('.');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;

  try {
    const header = decodeBase64UrlJson(parts[0]);
    if (!header || header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
      return null;
    }

    const payload = decodeBase64UrlJson(parts[1]);
    if (!payload || typeof payload.sub !== 'string' || !payload.sub.trim()) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || nowSec > payload.exp + 30) {
      return null;
    }
    if (typeof payload.nbf === 'number' && nowSec + 30 < payload.nbf) {
      return null;
    }

    const expectedIssuer = String(env?.CLERK_ISSUER || DEFAULT_CLERK_ISSUER)
      .trim()
      .replace(/\/+$/, '');
    const tokenIssuer = typeof payload.iss === 'string' ? payload.iss.trim().replace(/\/+$/, '') : '';
    if (!tokenIssuer || tokenIssuer !== expectedIssuer) {
      return null;
    }

    const jwksUrl = String(env?.CLERK_JWKS_URL || `${expectedIssuer}/.well-known/jwks.json`).trim();
    const cryptoKey = await getVerificationKey(jwksUrl, header.kid);
    if (!cryptoKey) {
      return null;
    }

    const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlToUint8Array(parts[2]);

    const verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signature as unknown as BufferSource,
      signingInput as unknown as BufferSource
    );

    if (!verified) {
      return null;
    }

    const orgId = payload.org_id || payload.o?.id || null;
    const orgRole = payload.org_role || payload.o?.rol || null;
    const rawEmail =
      typeof payload.email === 'string'
        ? payload.email
        : typeof payload.email_address === 'string'
        ? payload.email_address
        : null;

    return {
      userId: payload.sub.trim(),
      orgId: orgId ? String(orgId) : null,
      orgRole: orgRole ? String(orgRole) : null,
      email: rawEmail ? rawEmail.toLowerCase().trim() : null
    };
  } catch (_) {
    return null;
  }
}

export async function signOAuthState(
  payload: { clerkUserId: string; returnTo: string; nonce: string },
  secret: string
): Promise<string> {
  if (!secret) {
    throw new Error('GOOGLE_CLIENT_SECRET is required to sign OAuth state');
  }
  const fullPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 600
  };
  const payloadBytes = new TextEncoder().encode(JSON.stringify(fullPayload));
  const payloadB64 = uint8ArrayToBase64Url(payloadBytes);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret) as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuf = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payloadB64) as unknown as BufferSource
  );
  const sigB64 = uint8ArrayToBase64Url(new Uint8Array(sigBuf));
  return `${payloadB64}.${sigB64}`;
}

export async function verifyOAuthState(
  rawState: string | null,
  secret: string,
  expectedNonce?: string | null
): Promise<{ clerkUserId: string; returnTo: string; nonce: string } | null> {
  if (!rawState || !secret) return null;
  const dotIdx = rawState.indexOf('.');
  if (dotIdx <= 0) return null;

  const payloadB64 = rawState.slice(0, dotIdx);
  const sigB64 = rawState.slice(dotIdx + 1);
  if (!payloadB64 || !sigB64) return null;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret) as unknown as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const expectedSigBuf = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(payloadB64) as unknown as BufferSource
    );
    const expectedSigB64 = uint8ArrayToBase64Url(new Uint8Array(expectedSigBuf));
    if (!timingSafeEqualStr(sigB64, expectedSigB64)) {
      return null;
    }

    const parsed = decodeBase64UrlJson(payloadB64);
    if (
      !parsed ||
      typeof parsed.clerkUserId !== 'string' ||
      !parsed.clerkUserId.trim() ||
      typeof parsed.nonce !== 'string' ||
      !parsed.nonce.trim()
    ) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof parsed.exp !== 'number' || nowSec > parsed.exp) {
      return null;
    }

    if (expectedNonce && !timingSafeEqualStr(parsed.nonce, expectedNonce)) {
      return null;
    }

    const returnTo = isSafeReturnPath(parsed.returnTo) ? parsed.returnTo : '/organization';
    return {
      clerkUserId: parsed.clerkUserId.trim(),
      returnTo,
      nonce: parsed.nonce.trim()
    };
  } catch (_) {
    return null;
  }
}

export function isValidGtmAccountId(val?: string | null): boolean {
  return typeof val === 'string' && /^\d{1,25}$/.test(val.trim());
}

export function isValidGtmContainerPath(val?: string | null): boolean {
  return typeof val === 'string' && /^accounts\/\d{1,25}\/containers\/\d{1,25}$/.test(val.trim());
}

export function isValidGtmWorkspacePath(val?: string | null): boolean {
  return (
    typeof val === 'string' &&
    /^accounts\/\d{1,25}\/containers\/\d{1,25}\/workspaces\/\d{1,25}$/.test(val.trim())
  );
}

export function isValidGa4PropertyId(val?: string | null): boolean {
  return typeof val === 'string' && /^(properties\/)?\d{1,25}$/.test(val.trim());
}

export function isSafeReturnPath(val?: string | null): val is string {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return false;
  if (/[\r\n\0\\]/.test(trimmed)) return false;
  return true;
}

export function isValidEmail(val?: string | null): boolean {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(trimmed);
}

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function checkRateLimit(
  db: any,
  bucket: string,
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!db) {
    return { allowed: true, remaining: maxRequests, resetAt: 0 };
  }

  const safeId = (identifier || 'unknown').slice(0, 120);
  const key = `${bucket}:${safeId}`;
  const nowSec = Math.floor(Date.now() / 1000);

  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS rate_limits (
           key TEXT PRIMARY KEY,
           count INTEGER NOT NULL,
           reset_at INTEGER NOT NULL
         )`
      )
      .run();

    const row: any = await db
      .prepare('SELECT count, reset_at FROM rate_limits WHERE key = ? LIMIT 1')
      .bind(key)
      .first();

    if (!row || Number(row.reset_at) <= nowSec) {
      const nextReset = nowSec + windowSeconds;
      await db
        .prepare(
          `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
           ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at`
        )
        .bind(key, nextReset)
        .run();
      return { allowed: true, remaining: Math.max(0, maxRequests - 1), resetAt: nextReset };
    }

    const currentCount = Number(row.count) || 0;
    if (currentCount >= maxRequests) {
      return { allowed: false, remaining: 0, resetAt: Number(row.reset_at) };
    }

    await db
      .prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?')
      .bind(key)
      .run();

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - (currentCount + 1)),
      resetAt: Number(row.reset_at)
    };
  } catch (err) {
    console.warn('Rate limit check error:', err);
    return { allowed: true, remaining: maxRequests, resetAt: 0 };
  }
}
