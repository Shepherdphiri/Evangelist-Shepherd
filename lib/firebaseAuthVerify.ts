import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ADMIN_EMAIL = 'sheperdphiri88@gmail.com';
const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface FirebaseConfigFile {
  projectId?: string;
}

function resolveProjectId(): string {
  const candidates = [
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'firebase-applet-config.json'),
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(
          fs.readFileSync(filePath, 'utf8')
        ) as FirebaseConfigFile;
        if (typeof parsed.projectId === 'string' && parsed.projectId.trim()) {
          return parsed.projectId.trim();
        }
      }
    } catch {
      // Try next candidate
    }
  }
  return process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0111987158';
}

const FIREBASE_PROJECT_ID = resolveProjectId();

let cachedCerts: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedCerts && now < cachedCerts.expiresAt) {
    return cachedCerts.certs;
  }

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) {
    throw new Error('Unable to fetch Google public certificates.');
  }

  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  const certs = (await response.json()) as Record<string, string>;

  cachedCerts = {
    certs,
    expiresAt: now + Math.max(60, maxAgeSec) * 1000,
  };
  return certs;
}

export async function verifyFirebaseAdminToken(
  authHeader: string | string[] | undefined
): Promise<{ uid: string; email: string } | null> {
  const rawHeader = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (!rawHeader || !rawHeader.startsWith('Bearer ')) return null;
  const token = rawHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;

  try {
    const header = JSON.parse(
      Buffer.from(headerB64, 'base64url').toString('utf8')
    ) as { alg?: string; kid?: string };
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
      return null;
    }

    const certs = await getGooglePublicCerts();
    const certPem = certs[header.kid];
    if (!certPem) return null;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    const signatureValid = verifier.verify(
      certPem,
      Buffer.from(sigB64, 'base64url')
    );
    if (!signatureValid) return null;

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8')
    ) as {
      aud?: unknown;
      iss?: unknown;
      sub?: unknown;
      exp?: unknown;
      iat?: unknown;
      email?: unknown;
      email_verified?: unknown;
    };

    const nowSec = Math.floor(Date.now() / 1000);
    const expectedIss = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;

    if (
      payload.aud !== FIREBASE_PROJECT_ID ||
      payload.iss !== expectedIss ||
      typeof payload.sub !== 'string' ||
      payload.sub.length === 0 ||
      typeof payload.exp !== 'number' ||
      payload.exp <= nowSec ||
      typeof payload.iat !== 'number' ||
      payload.iat > nowSec + 300 ||
      payload.email !== ADMIN_EMAIL ||
      payload.email_verified !== true
    ) {
      return null;
    }

    return { uid: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
