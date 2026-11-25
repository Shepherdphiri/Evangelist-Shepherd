import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { verifyAdminAccess } from './lib/adminSession.ts';
import { handleNeonApiRequest } from './lib/neonBackend.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

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

  const neonJson = express.json({ limit: '5mb' });
  app.all('/api/neondb', neonJson, async (req, res) => {
    await handleNeonApiRequest(
      {
        method: req.method,
        query: req.query as Record<string, string | string[] | undefined>,
        url: req.url,
        headers: req.headers,
        body: req.body,
      },
      res
    );
  });

  app.post('/api/admin/upload-image', express.json({ limit: '6mb' }), async (req, res) => {
    const adminSession = await verifyAdminAccess(req.headers);
    if (!adminSession) {
      res.status(401).json({ error: 'Authorized admin sign-in is required to upload images.' });
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
