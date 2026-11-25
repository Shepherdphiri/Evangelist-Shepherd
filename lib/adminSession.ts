import crypto from 'node:crypto';
import { verifyFirebaseAdminToken } from './firebaseAuthVerify.ts';

export const ADMIN_SESSION_COOKIE_NAME = 'evangelist_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;

const failedAttemptsByIp = new Map<string, { count: number; resetAt: number }>();

function getConfiguredAdminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || '';
}

export function isPasswordAuthConfigured(): boolean {
  return getConfiguredAdminPassword().length > 0;
}

function getSigningSecret(): string {
  const explicit = process.env.SESSION_SECRET?.trim();
  if (explicit) return explicit;
  const pwd = getConfiguredAdminPassword();
  if (!pwd) return '';
  const dbSalt = process.env.DATABASE_URL?.trim() || 'evangelist-shepherd-admin-v1';
  return crypto.createHmac('sha256', pwd).update(dbSalt).digest('hex');
}

export function verifyAdminPassword(candidate: string): boolean {
  const expected = getConfiguredAdminPassword();
  if (!expected || !candidate) return false;
  const candidateHash = crypto.createHash('sha256').update(candidate).digest();
  const expectedHash = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(candidateHash, expectedHash);
}

export function createAdminSessionToken(): string | null {
  const secret = getSigningSecret();
  if (!secret) return null;
  const payload = {
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sigB64 = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sigB64}`;
}

export function verifyAdminSessionToken(token: string): boolean {
  const secret = getSigningSecret();
  if (!secret || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return false;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');

  const actualHash = crypto.createHash('sha256').update(sigB64).digest();
  const expectedHash = crypto.createHash('sha256').update(expectedSig).digest();
  if (!crypto.timingSafeEqual(actualHash, expectedHash)) {
    return false;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as { role?: unknown; exp?: unknown };
    const nowSec = Math.floor(Date.now() / 1000);
    return (
      parsed.role === 'admin' &&
      typeof parsed.exp === 'number' &&
      parsed.exp > nowSec
    );
  } catch {
    return false;
  }
}

export function parseCookies(
  cookieHeader: string | string[] | undefined
): Record<string, string> {
  const raw = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader;
  if (!raw) return {};
  const result: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        result[key] = decodeURIComponent(val);
      } catch {
        result[key] = val;
      }
    }
  }
  return result;
}

function isHttpsRequest(headers: Record<string, string | string[] | undefined>): boolean {
  const proto = headers['x-forwarded-proto'];
  const protoStr = Array.isArray(proto) ? proto[0] : proto;
  return protoStr?.toLowerCase().includes('https') || process.env.NODE_ENV === 'production';
}

export function setAdminSessionCookie(
  res: { setHeader: (name: string, value: string) => void },
  headers: Record<string, string | string[] | undefined>,
  token: string
): void {
  const secureFlag = isHttpsRequest(headers) ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secureFlag}`
  );
}

export function clearAdminSessionCookie(
  res: { setHeader: (name: string, value: string) => void },
  headers: Record<string, string | string[] | undefined>
): void {
  const secureFlag = isHttpsRequest(headers) ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`
  );
}

export async function verifyAdminAccess(
  headers: Record<string, string | string[] | undefined>
): Promise<{ uid: string; email?: string; method: 'password' | 'firebase' } | null> {
  // 1. Check HttpOnly session cookie
  const cookies = parseCookies(headers.cookie);
  const cookieToken = cookies[ADMIN_SESSION_COOKIE_NAME];
  if (cookieToken && verifyAdminSessionToken(cookieToken)) {
    return { uid: 'admin', method: 'password' };
  }

  // 2. Check Authorization: Bearer <admin-session-token>
  const rawAuth = Array.isArray(headers.authorization)
    ? headers.authorization[0]
    : headers.authorization;
  if (rawAuth?.startsWith('Bearer ')) {
    const bearer = rawAuth.slice(7).trim();
    if (verifyAdminSessionToken(bearer)) {
      return { uid: 'admin', method: 'password' };
    }
  }

  // 3. Fallback: Firebase Admin Google ID Token (used when in Firebase/AI Studio mode)
  const fbAdmin = await verifyFirebaseAdminToken(headers.authorization);
  if (fbAdmin) {
    return { uid: fbAdmin.uid, email: fbAdmin.email, method: 'firebase' };
  }

  return null;
}

export function getClientIp(
  headers: Record<string, string | string[] | undefined>
): string {
  const forwarded = headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (raw) {
    return raw.split(',')[0]?.trim() || 'unknown';
  }
  const realIp = headers['x-real-ip'];
  const realIpStr = Array.isArray(realIp) ? realIp[0] : realIp;
  return realIpStr?.trim() || 'unknown';
}

export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  retryAfterSec?: number;
} {
  const now = Date.now();
  const entry = failedAttemptsByIp.get(ip);
  if (!entry) return { allowed: true };
  if (now > entry.resetAt) {
    failedAttemptsByIp.delete(ip);
    return { allowed: true };
  }
  if (entry.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { allowed: true };
}

export function recordFailedLoginAttempt(ip: string): void {
  const now = Date.now();
  const entry = failedAttemptsByIp.get(ip);
  if (!entry || now > entry.resetAt) {
    failedAttemptsByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearLoginRateLimit(ip: string): void {
  failedAttemptsByIp.delete(ip);
}
