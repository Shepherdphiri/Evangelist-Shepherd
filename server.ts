import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// Session signing key from env or ephemeral in-memory 256-bit key
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 16
    ? process.env.ADMIN_SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

interface StoredCredential {
  username: string;
  salt: string;
  hash: string;
}

let claimedCredential: StoredCredential | null = null;
const revokedTokens = new Set<string>();

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function signSessionToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: username,
      jti: crypto.randomBytes(12).toString('hex'),
      exp: Date.now() + 12 * 60 * 60 * 1000,
    }),
    'utf8'
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(authHeader: string | undefined): { username: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token || revokedTokens.has(token)) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  if (!safeEqualString(sigB64, expectedSig)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed.sub !== 'string' || typeof parsed.exp !== 'number') {
      return null;
    }
    if (Date.now() > parsed.exp) return null;
    return { username: parsed.sub };
  } catch {
    return null;
  }
}

function isEnvConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_USERNAME &&
      process.env.ADMIN_USERNAME.trim().length > 0 &&
      process.env.ADMIN_PASSWORD &&
      process.env.ADMIN_PASSWORD.trim().length > 0
  );
}

function verifyImageMagicBytes(buf: Buffer, ext: string): boolean {
  if (buf.length < 12) return false;
  if (ext === 'jpg') {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (ext === 'png') {
    return (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    );
  }
  if (ext === 'gif') {
    return buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38;
  }
  if (ext === 'webp') {
    return (
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    );
  }
  return false;
}

async function startServer() {
  const app = express();
  const uploadsDir = path.resolve(__dirname, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  app.use(
    '/uploads',
    express.static(uploadsDir, {
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    })
  );

  const smallJson = express.json({ limit: '32kb' });
  app.use((req, res, next) => {
    if (req.path === '/api/admin/upload-image') {
      next();
      return;
    }
    smallJson(req, res, next);
  });

  app.get('/api/admin/status', (req, res) => {
    const configured = isEnvConfigured() || claimedCredential !== null;
    const session = verifySessionToken(req.headers.authorization);
    res.json({
      configured,
      authenticated: Boolean(session),
      username: session?.username || null,
    });
  });

  app.post('/api/admin/setup', (req, res) => {
    if (isEnvConfigured() || claimedCredential !== null) {
      res.status(409).json({ error: 'Admin credentials are already configured.' });
      return;
    }
    const rawUser = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const rawPass = typeof req.body?.password === 'string' ? req.body.password : '';
    if (rawUser.length < 3 || rawUser.length > 64 || rawPass.length < 4 || rawPass.length > 128) {
      res.status(400).json({ error: 'Account name (3-64 chars) and password (4-128 chars) are required.' });
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(rawPass, salt);
    claimedCredential = { username: rawUser, salt, hash };
    const token = signSessionToken(rawUser);
    res.json({ token, username: rawUser });
  });

  app.post('/api/admin/login', (req, res) => {
    const rawUser = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const rawPass = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!rawUser || !rawPass) {
      res.status(400).json({ error: 'Account name and password are required.' });
      return;
    }

    if (isEnvConfigured()) {
      const envUser = process.env.ADMIN_USERNAME!.trim();
      const envPass = process.env.ADMIN_PASSWORD!;
      const userOk = safeEqualString(rawUser, envUser);
      const passOk = safeEqualString(rawPass, envPass);
      if (!userOk || !passOk) {
        res.status(401).json({ error: 'Invalid account name or password.' });
        return;
      }
      const token = signSessionToken(envUser);
      res.json({ token, username: envUser });
      return;
    }

    if (!claimedCredential) {
      res.status(403).json({ error: 'Admin account has not been initialized yet.' });
      return;
    }

    const userOk = safeEqualString(rawUser, claimedCredential.username);
    const candidateHash = hashPassword(rawPass, claimedCredential.salt);
    const passOk = safeEqualString(candidateHash, claimedCredential.hash);
    if (!userOk || !passOk) {
      res.status(401).json({ error: 'Invalid account name or password.' });
      return;
    }

    const token = signSessionToken(claimedCredential.username);
    res.json({ token, username: claimedCredential.username });
  });

  app.post('/api/admin/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      revokedTokens.add(authHeader.slice(7).trim());
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/upload-image', express.json({ limit: '6mb' }), (req, res) => {
    const session = verifySessionToken(req.headers.authorization);
    if (!session) {
      res.status(401).json({ error: 'Admin authentication required to upload images.' });
      return;
    }

    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
    const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      res.status(400).json({ error: 'Invalid image format. Allowed: JPEG, PNG, WebP, or GIF.' });
      return;
    }

    const rawSubtype = match[1].toLowerCase();
    const ext = rawSubtype === 'jpeg' || rawSubtype === 'jpg' ? 'jpg' : rawSubtype;
    const buffer = Buffer.from(match[2], 'base64');

    if (buffer.length === 0 || buffer.length > 4 * 1024 * 1024) {
      res.status(413).json({ error: 'Image must be smaller than 4 MB.' });
      return;
    }

    if (!verifyImageMagicBytes(buffer, ext)) {
      res.status(400).json({ error: 'Uploaded file does not match a valid image signature.' });
      return;
    }

    const filename = `img_${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const targetPath = path.resolve(uploadsDir, filename);
    if (!targetPath.startsWith(uploadsDir + path.sep)) {
      res.status(400).json({ error: 'Invalid upload path.' });
      return;
    }

    try {
      fs.writeFileSync(targetPath, buffer);
      res.json({ url: `/uploads/${filename}` });
    } catch {
      res.status(500).json({ error: 'Failed to save uploaded image.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
