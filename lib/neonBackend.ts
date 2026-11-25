import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { verifyFirebaseAdminToken } from './firebaseAuthVerify.ts';
import {
  DEFAULT_MINISTRY_SETTINGS_DATA,
  STARTER_FAITH_ARTICLES_DATA,
  STARTER_PROGRAMS_DATA,
  STARTER_SERMONS_DATA,
} from '../shared/starterData.ts';

type SqlClient = ReturnType<typeof neon>;

export interface ApiRequestLike {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ApiResponseLike {
  status: (code: number) => ApiResponseLike;
  json: (payload: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

const VALID_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;
const VALID_CATEGORIES = new Set([
  'Short Sermon',
  'Midweek Message',
  'Word of Encouragement',
]);
const VALID_REQUEST_TYPES = new Set([
  'Prayer Request',
  'Inquiry',
  'Testimony',
  'General Message',
]);
const VALID_REQUEST_STATUSES = new Set([
  'unread',
  'prayed_over',
  'replied',
  'archived',
]);

let schemaInitPromise: Promise<void> | null = null;
let cachedSqlUrl = '';
let cachedSql: SqlClient | null = null;

function getSqlClient(): SqlClient | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!cachedSql || cachedSqlUrl !== url) {
    cachedSqlUrl = url;
    cachedSql = neon(url);
    schemaInitPromise = null;
  }
  return cachedSql;
}

function cleanStr(val: unknown, max: number, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  return val.trim().slice(0, max);
}

function cleanInt(val: unknown, min: number, max: number, fallback: number): number {
  const n = Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function sanitizeUrl(val: unknown, max: number): string {
  const trimmed = cleanStr(val, max);
  if (!trimmed) return '';
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return `https://${trimmed}`.slice(0, max);
}

function makeId(prefix: string): string {
  const clean = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'doc';
  return `${clean}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

async function ensureSchemaAndSeed(sql: SqlClient): Promise<void> {
  if (!schemaInitPromise) {
    schemaInitPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS ministry_settings (
          id TEXT PRIMARY KEY,
          evangelist_name TEXT NOT NULL,
          hero_eyebrow TEXT NOT NULL,
          ministry_tagline TEXT NOT NULL,
          hero_primary_cta_label TEXT NOT NULL,
          hero_secondary_cta_label TEXT NOT NULL,
          about_bio TEXT NOT NULL,
          portrait_url TEXT NOT NULL DEFAULT '',
          weekly_verse TEXT NOT NULL,
          weekly_verse_ref TEXT NOT NULL,
          contact_email TEXT NOT NULL DEFAULT '',
          location TEXT NOT NULL DEFAULT '',
          footer_heading TEXT NOT NULL,
          footer_bio TEXT NOT NULL DEFAULT '',
          footer_copyright TEXT NOT NULL DEFAULT '',
          footer_credit TEXT NOT NULL DEFAULT '',
          hide_demo_sermons BOOLEAN NOT NULL DEFAULT FALSE,
          hide_demo_articles BOOLEAN NOT NULL DEFAULT FALSE,
          hide_demo_programs BOOLEAN NOT NULL DEFAULT FALSE,
          youtube_url TEXT NOT NULL DEFAULT '',
          facebook_url TEXT NOT NULL DEFAULT '',
          instagram_url TEXT NOT NULL DEFAULT '',
          tiktok_url TEXT NOT NULL DEFAULT '',
          x_url TEXT NOT NULL DEFAULT '',
          whatsapp_url TEXT NOT NULL DEFAULT '',
          podcast_url TEXT NOT NULL DEFAULT '',
          updated_by TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS sermons (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          scripture_ref TEXT NOT NULL,
          scripture_quote TEXT NOT NULL DEFAULT '',
          summary TEXT NOT NULL,
          content TEXT NOT NULL,
          read_time_minutes INTEGER NOT NULL DEFAULT 3,
          cover_image TEXT NOT NULL DEFAULT '',
          video_url TEXT NOT NULL DEFAULT '',
          is_featured BOOLEAN NOT NULL DEFAULT FALSE,
          is_published BOOLEAN NOT NULL DEFAULT TRUE,
          amen_count INTEGER NOT NULL DEFAULT 0,
          pray_count INTEGER NOT NULL DEFAULT 0,
          love_count INTEGER NOT NULL DEFAULT 0,
          view_count INTEGER NOT NULL DEFAULT 0,
          author_id TEXT NOT NULL,
          author_name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS faith_articles (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          question_prompt TEXT NOT NULL,
          topic TEXT NOT NULL,
          scripture_ref TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          content TEXT NOT NULL,
          cover_image TEXT NOT NULL DEFAULT '',
          read_time_minutes INTEGER NOT NULL DEFAULT 4,
          view_count INTEGER NOT NULL DEFAULT 0,
          is_published BOOLEAN NOT NULL DEFAULT TRUE,
          author_id TEXT NOT NULL,
          author_name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS programs (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          schedule TEXT NOT NULL,
          format TEXT NOT NULL,
          description TEXT NOT NULL,
          location_or_link TEXT NOT NULL DEFAULT '',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          order_index INTEGER NOT NULL DEFAULT 1,
          author_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS prayer_requests (
          id TEXT PRIMARY KEY,
          sender_name TEXT NOT NULL,
          sender_email TEXT NOT NULL DEFAULT '',
          sender_phone TEXT NOT NULL DEFAULT '',
          request_type TEXT NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          is_private BOOLEAN NOT NULL DEFAULT TRUE,
          status TEXT NOT NULL DEFAULT 'unread',
          admin_note TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS engagement_metrics (
          id TEXT PRIMARY KEY,
          view_count INTEGER NOT NULL DEFAULT 0,
          amen_count INTEGER NOT NULL DEFAULT 0,
          pray_count INTEGER NOT NULL DEFAULT 0,
          love_count INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      const existingSettings = (await sql`
        SELECT id FROM ministry_settings WHERE id = 'main' LIMIT 1
      `) as Array<{ id: string }>;

      if (existingSettings.length === 0) {
        const s = DEFAULT_MINISTRY_SETTINGS_DATA;
        await sql`
          INSERT INTO ministry_settings (
            id, evangelist_name, hero_eyebrow, ministry_tagline,
            hero_primary_cta_label, hero_secondary_cta_label, about_bio,
            portrait_url, weekly_verse, weekly_verse_ref, contact_email,
            location, footer_heading, footer_bio, footer_copyright,
            footer_credit, hide_demo_sermons, hide_demo_articles,
            hide_demo_programs, youtube_url, facebook_url, instagram_url,
            tiktok_url, x_url, whatsapp_url, podcast_url, updated_by
          ) VALUES (
            'main', ${s.evangelistName}, ${s.heroEyebrow}, ${s.ministryTagline},
            ${s.heroPrimaryCtaLabel}, ${s.heroSecondaryCtaLabel}, ${s.aboutBio},
            ${s.portraitUrl}, ${s.weeklyVerse}, ${s.weeklyVerseRef}, ${s.contactEmail},
            ${s.location}, ${s.footerHeading}, ${s.footerBio}, ${s.footerCopyright},
            ${s.footerCredit}, TRUE, TRUE, TRUE,
            ${s.youtubeUrl}, ${s.facebookUrl}, ${s.instagramUrl},
            ${s.tiktokUrl}, ${s.xUrl}, ${s.whatsappUrl}, ${s.podcastUrl}, 'system_seed'
          )
          ON CONFLICT (id) DO NOTHING
        `;
        await seedFreshContent(sql, 'evangelist-shepherd');
      }
    })().catch((err) => {
      schemaInitPromise = null;
      throw err;
    });
  }
  await schemaInitPromise;
}

async function seedFreshContent(sql: SqlClient, authorId: string): Promise<void> {
  for (let i = 0; i < STARTER_SERMONS_DATA.length; i += 1) {
    const item = STARTER_SERMONS_DATA[i];
    const id = makeId('sermon');
    const createdAt = new Date(Date.now() - i * 86_400_000).toISOString();
    await sql`
      INSERT INTO sermons (
        id, title, category, scripture_ref, scripture_quote, summary, content,
        read_time_minutes, cover_image, video_url, is_featured, is_published,
        amen_count, pray_count, love_count, view_count, author_id, author_name,
        created_at, updated_at
      ) VALUES (
        ${id}, ${item.title}, ${item.category}, ${item.scriptureRef},
        ${item.scriptureQuote}, ${item.summary}, ${item.content},
        ${item.readTimeMinutes}, ${item.coverImage}, ${item.videoUrl},
        ${item.isFeatured}, ${item.isPublished}, 0, 0, 0, 0,
        ${authorId}, ${item.authorName}, ${createdAt}::timestamptz, ${createdAt}::timestamptz
      )
    `;
  }

  for (let i = 0; i < STARTER_FAITH_ARTICLES_DATA.length; i += 1) {
    const item = STARTER_FAITH_ARTICLES_DATA[i];
    const id = makeId('faith');
    const createdAt = new Date(Date.now() - i * 86_400_000).toISOString();
    await sql`
      INSERT INTO faith_articles (
        id, title, question_prompt, topic, scripture_ref, excerpt, content,
        cover_image, read_time_minutes, view_count, is_published,
        author_id, author_name, created_at, updated_at
      ) VALUES (
        ${id}, ${item.title}, ${item.questionPrompt}, ${item.topic},
        ${item.scriptureRef}, ${item.excerpt}, ${item.content},
        ${item.coverImage}, ${item.readTimeMinutes}, 0, ${item.isPublished},
        ${authorId}, ${item.authorName}, ${createdAt}::timestamptz, ${createdAt}::timestamptz
      )
    `;
  }

  for (let i = 0; i < STARTER_PROGRAMS_DATA.length; i += 1) {
    const item = STARTER_PROGRAMS_DATA[i];
    const id = makeId('prog');
    const createdAt = new Date(Date.now() - i * 86_400_000).toISOString();
    await sql`
      INSERT INTO programs (
        id, title, schedule, format, description, location_or_link,
        is_active, order_index, author_id, created_at, updated_at
      ) VALUES (
        ${id}, ${item.title}, ${item.schedule}, ${item.format},
        ${item.description}, ${item.locationOrLink}, ${item.isActive},
        ${item.orderIndex}, ${authorId}, ${createdAt}::timestamptz, ${createdAt}::timestamptz
      )
    `;
  }
}

function mapSermonRow(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    title: String(r.title || ''),
    category: String(r.category || 'Short Sermon'),
    scriptureRef: String(r.scripture_ref || ''),
    scriptureQuote: String(r.scripture_quote || ''),
    summary: String(r.summary || ''),
    content: String(r.content || ''),
    readTimeMinutes: Number(r.read_time_minutes) || 3,
    coverImage: String(r.cover_image || ''),
    videoUrl: String(r.video_url || ''),
    isFeatured: Boolean(r.is_featured),
    isPublished: Boolean(r.is_published),
    amenCount: Number(r.amen_count) || 0,
    prayCount: Number(r.pray_count) || 0,
    loveCount: Number(r.love_count) || 0,
    viewCount: Number(r.view_count) || 0,
    authorId: String(r.author_id || ''),
    authorName: String(r.author_name || 'Evangelist Shepherd'),
    createdAt: r.created_at ? new Date(String(r.created_at)).toISOString() : null,
    updatedAt: r.updated_at ? new Date(String(r.updated_at)).toISOString() : null,
  };
}

function mapArticleRow(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    title: String(r.title || ''),
    questionPrompt: String(r.question_prompt || ''),
    topic: String(r.topic || 'Faith'),
    scriptureRef: String(r.scripture_ref || ''),
    excerpt: String(r.excerpt || ''),
    content: String(r.content || ''),
    coverImage: String(r.cover_image || ''),
    readTimeMinutes: Number(r.read_time_minutes) || 4,
    viewCount: Number(r.view_count) || 0,
    isPublished: Boolean(r.is_published),
    authorId: String(r.author_id || ''),
    authorName: String(r.author_name || 'Evangelist Shepherd'),
    createdAt: r.created_at ? new Date(String(r.created_at)).toISOString() : null,
    updatedAt: r.updated_at ? new Date(String(r.updated_at)).toISOString() : null,
  };
}

function mapProgramRow(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    title: String(r.title || ''),
    schedule: String(r.schedule || ''),
    format: String(r.format || ''),
    description: String(r.description || ''),
    locationOrLink: String(r.location_or_link || ''),
    isActive: Boolean(r.is_active),
    orderIndex: Number(r.order_index) || 1,
    authorId: String(r.author_id || ''),
    createdAt: r.created_at ? new Date(String(r.created_at)).toISOString() : null,
    updatedAt: r.updated_at ? new Date(String(r.updated_at)).toISOString() : null,
  };
}

function mapSettingsRow(r: Record<string, unknown> | undefined) {
  if (!r) return DEFAULT_MINISTRY_SETTINGS_DATA;
  return {
    evangelistName: String(r.evangelist_name || DEFAULT_MINISTRY_SETTINGS_DATA.evangelistName),
    heroEyebrow: String(r.hero_eyebrow || DEFAULT_MINISTRY_SETTINGS_DATA.heroEyebrow),
    ministryTagline: String(r.ministry_tagline || DEFAULT_MINISTRY_SETTINGS_DATA.ministryTagline),
    heroPrimaryCtaLabel: String(r.hero_primary_cta_label || DEFAULT_MINISTRY_SETTINGS_DATA.heroPrimaryCtaLabel),
    heroSecondaryCtaLabel: String(r.hero_secondary_cta_label || DEFAULT_MINISTRY_SETTINGS_DATA.heroSecondaryCtaLabel),
    aboutBio: String(r.about_bio || DEFAULT_MINISTRY_SETTINGS_DATA.aboutBio),
    portraitUrl: String(r.portrait_url || DEFAULT_MINISTRY_SETTINGS_DATA.portraitUrl),
    weeklyVerse: String(r.weekly_verse || DEFAULT_MINISTRY_SETTINGS_DATA.weeklyVerse),
    weeklyVerseRef: String(r.weekly_verse_ref || DEFAULT_MINISTRY_SETTINGS_DATA.weeklyVerseRef),
    contactEmail: String(r.contact_email ?? ''),
    location: String(r.location ?? ''),
    footerHeading: String(r.footer_heading || DEFAULT_MINISTRY_SETTINGS_DATA.footerHeading),
    footerBio: String(r.footer_bio ?? ''),
    footerCopyright: String(r.footer_copyright ?? ''),
    footerCredit: String(r.footer_credit ?? ''),
    hideDemoSermons: Boolean(r.hide_demo_sermons),
    hideDemoArticles: Boolean(r.hide_demo_articles),
    hideDemoPrograms: Boolean(r.hide_demo_programs),
    youtubeUrl: String(r.youtube_url ?? ''),
    facebookUrl: String(r.facebook_url ?? ''),
    instagramUrl: String(r.instagram_url ?? ''),
    tiktokUrl: String(r.tiktok_url ?? ''),
    xUrl: String(r.x_url ?? ''),
    whatsappUrl: String(r.whatsapp_url ?? ''),
    podcastUrl: String(r.podcast_url ?? ''),
  };
}

function mapPrayerRow(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    senderName: String(r.sender_name || ''),
    senderEmail: String(r.sender_email || ''),
    senderPhone: String(r.sender_phone || ''),
    requestType: String(r.request_type || 'Prayer Request'),
    subject: String(r.subject || ''),
    message: String(r.message || ''),
    isPrivate: Boolean(r.is_private),
    status: String(r.status || 'unread'),
    adminNote: String(r.admin_note || ''),
    createdAt: r.created_at ? new Date(String(r.created_at)).toISOString() : null,
    updatedAt: r.updated_at ? new Date(String(r.updated_at)).toISOString() : null,
  };
}

function parseActionQuery(req: ApiRequestLike): string {
  if (req.query && typeof req.query.action === 'string') {
    return req.query.action;
  }
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      return parsed.searchParams.get('action') || '';
    } catch {
      return '';
    }
  }
  return '';
}

function parseBodyObject(rawBody: unknown): Record<string, unknown> {
  if (!rawBody) return {};
  if (typeof rawBody === 'string') {
    try {
      const parsed = JSON.parse(rawBody);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof rawBody === 'object') {
    return rawBody as Record<string, unknown>;
  }
  return {};
}

export async function handleNeonApiRequest(
  req: ApiRequestLike,
  res: ApiResponseLike
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  const sql = getSqlClient();

  if (!sql) {
    if (req.method === 'GET') {
      res.status(200).json({ enabled: false });
      return;
    }
    res.status(501).json({
      enabled: false,
      error: 'NeonDB DATABASE_URL is not configured on this server.',
    });
    return;
  }

  try {
    await ensureSchemaAndSeed(sql);

    if (req.method === 'GET') {
      const action = parseActionQuery(req) || 'bootstrap';

      if (action === 'inbox') {
        const admin = await verifyFirebaseAdminToken(req.headers.authorization);
        if (!admin) {
          res.status(401).json({ error: 'Admin sign-in required.' });
          return;
        }
        const rows = (await sql`
          SELECT * FROM prayer_requests ORDER BY created_at DESC
        `) as Record<string, unknown>[];
        res.status(200).json({
          enabled: true,
          requests: rows.map(mapPrayerRow),
        });
        return;
      }

      const admin = await verifyFirebaseAdminToken(req.headers.authorization);

      const settingsRows = (await sql`
        SELECT * FROM ministry_settings WHERE id = 'main' LIMIT 1
      `) as Record<string, unknown>[];

      const sermonRows = admin
        ? ((await sql`SELECT * FROM sermons ORDER BY created_at DESC`) as Record<string, unknown>[])
        : ((await sql`
            SELECT * FROM sermons WHERE is_published = TRUE ORDER BY created_at DESC
          `) as Record<string, unknown>[]);

      const articleRows = admin
        ? ((await sql`SELECT * FROM faith_articles ORDER BY created_at DESC`) as Record<string, unknown>[])
        : ((await sql`
            SELECT * FROM faith_articles WHERE is_published = TRUE ORDER BY created_at DESC
          `) as Record<string, unknown>[]);

      const programRows = admin
        ? ((await sql`SELECT * FROM programs ORDER BY order_index ASC, created_at DESC`) as Record<string, unknown>[])
        : ((await sql`
            SELECT * FROM programs WHERE is_active = TRUE ORDER BY order_index ASC, created_at DESC
          `) as Record<string, unknown>[]);

      const metricRows = (await sql`
        SELECT id, view_count, amen_count, pray_count, love_count FROM engagement_metrics
      `) as Record<string, unknown>[];

      const engagementMetrics: Record<
        string,
        { viewCount: number; amenCount: number; prayCount: number; loveCount: number }
      > = {};
      for (const m of metricRows) {
        engagementMetrics[String(m.id)] = {
          viewCount: Number(m.view_count) || 0,
          amenCount: Number(m.amen_count) || 0,
          prayCount: Number(m.pray_count) || 0,
          loveCount: Number(m.love_count) || 0,
        };
      }

      res.status(200).json({
        enabled: true,
        settings: mapSettingsRow(settingsRows[0]),
        sermons: sermonRows.map(mapSermonRow),
        articles: articleRows.map(mapArticleRow),
        programs: programRows.map(mapProgramRow),
        engagementMetrics,
      });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed.' });
      return;
    }

    const body = parseBodyObject(req.body);
    const action = typeof body.action === 'string' ? body.action : '';

    // --- PUBLIC ENDPOINTS ---
    if (action === 'increment_metric') {
      const targetType = typeof body.targetType === 'string' ? body.targetType : '';
      const id = typeof body.id === 'string' ? body.id.trim() : '';
      const field = typeof body.field === 'string' ? body.field : '';

      if (!VALID_ID_RE.test(id)) {
        res.status(400).json({ error: 'Invalid record identifier.' });
        return;
      }

      if (targetType === 'sermon') {
        if (field === 'viewCount') {
          await sql`UPDATE sermons SET view_count = view_count + 1 WHERE id = ${id} AND is_published = TRUE`;
        } else if (field === 'amenCount') {
          await sql`UPDATE sermons SET amen_count = amen_count + 1 WHERE id = ${id} AND is_published = TRUE`;
        } else if (field === 'prayCount') {
          await sql`UPDATE sermons SET pray_count = pray_count + 1 WHERE id = ${id} AND is_published = TRUE`;
        } else if (field === 'loveCount') {
          await sql`UPDATE sermons SET love_count = love_count + 1 WHERE id = ${id} AND is_published = TRUE`;
        } else {
          res.status(400).json({ error: 'Invalid metric field.' });
          return;
        }
        res.status(200).json({ ok: true });
        return;
      }

      if (targetType === 'article') {
        if (field !== 'viewCount') {
          res.status(400).json({ error: 'Invalid metric field.' });
          return;
        }
        await sql`UPDATE faith_articles SET view_count = view_count + 1 WHERE id = ${id} AND is_published = TRUE`;
        res.status(200).json({ ok: true });
        return;
      }

      res.status(400).json({ error: 'Invalid metric target.' });
      return;
    }

    if (action === 'create_prayer_request') {
      const senderName = cleanStr(body.senderName, 80);
      const senderEmail = cleanStr(body.senderEmail, 120);
      const senderPhone = cleanStr(body.senderPhone, 40);
      const requestType =
        typeof body.requestType === 'string' && VALID_REQUEST_TYPES.has(body.requestType)
          ? body.requestType
          : 'Prayer Request';
      const subject = cleanStr(body.subject, 140);
      const message = cleanStr(body.message, 3000);
      const isPrivate = body.isPrivate !== false;

      if (senderName.length < 2 || subject.length < 2 || message.length < 5) {
        res.status(400).json({ error: 'Please complete your name, subject, and message.' });
        return;
      }
      if (senderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
        res.status(400).json({ error: 'Invalid email address.' });
        return;
      }

      const id = makeId('req');
      await sql`
        INSERT INTO prayer_requests (
          id, sender_name, sender_email, sender_phone, request_type,
          subject, message, is_private, status, admin_note
        ) VALUES (
          ${id}, ${senderName}, ${senderEmail}, ${senderPhone}, ${requestType},
          ${subject}, ${message}, ${isPrivate}, 'unread', ''
        )
      `;
      res.status(200).json({ ok: true, id });
      return;
    }

    // --- ADMIN-ONLY MUTATIONS ---
    const admin = await verifyFirebaseAdminToken(req.headers.authorization);
    if (!admin) {
      res.status(401).json({ error: 'Authorized Firebase admin sign-in is required.' });
      return;
    }

    if (action === 'save_settings') {
      const s = DEFAULT_MINISTRY_SETTINGS_DATA;
      const evangelistName = cleanStr(body.evangelistName, 80, s.evangelistName);
      const heroEyebrow = cleanStr(body.heroEyebrow, 100, s.heroEyebrow);
      const ministryTagline = cleanStr(body.ministryTagline, 160, s.ministryTagline);
      const heroPrimaryCtaLabel = cleanStr(body.heroPrimaryCtaLabel, 40, s.heroPrimaryCtaLabel);
      const heroSecondaryCtaLabel = cleanStr(body.heroSecondaryCtaLabel, 40, s.heroSecondaryCtaLabel);
      const aboutBio = cleanStr(body.aboutBio, 2000, s.aboutBio);
      const portraitUrl = cleanStr(body.portraitUrl, 500, '');
      const weeklyVerse = cleanStr(body.weeklyVerse, 400, s.weeklyVerse);
      const weeklyVerseRef = cleanStr(body.weeklyVerseRef, 80, s.weeklyVerseRef);
      const contactEmail = cleanStr(body.contactEmail, 120, '');
      const location = cleanStr(body.location, 120, '');
      const footerHeading = cleanStr(body.footerHeading, 80, evangelistName);
      const footerBio = cleanStr(body.footerBio, 300, '');
      const footerCopyright = cleanStr(body.footerCopyright, 140, '');
      const footerCredit = cleanStr(body.footerCredit, 120, '');
      const hideDemoSermons = Boolean(body.hideDemoSermons);
      const hideDemoArticles = Boolean(body.hideDemoArticles);
      const hideDemoPrograms = Boolean(body.hideDemoPrograms);
      const youtubeUrl = sanitizeUrl(body.youtubeUrl, 300);
      const facebookUrl = sanitizeUrl(body.facebookUrl, 300);
      const instagramUrl = sanitizeUrl(body.instagramUrl, 300);
      const tiktokUrl = sanitizeUrl(body.tiktokUrl, 300);
      const xUrl = sanitizeUrl(body.xUrl, 300);
      const whatsappUrl = sanitizeUrl(body.whatsappUrl, 300);
      const podcastUrl = sanitizeUrl(body.podcastUrl, 300);

      await sql`
        INSERT INTO ministry_settings (
          id, evangelist_name, hero_eyebrow, ministry_tagline,
          hero_primary_cta_label, hero_secondary_cta_label, about_bio,
          portrait_url, weekly_verse, weekly_verse_ref, contact_email,
          location, footer_heading, footer_bio, footer_copyright,
          footer_credit, hide_demo_sermons, hide_demo_articles,
          hide_demo_programs, youtube_url, facebook_url, instagram_url,
          tiktok_url, x_url, whatsapp_url, podcast_url, updated_by, updated_at
        ) VALUES (
          'main', ${evangelistName}, ${heroEyebrow}, ${ministryTagline},
          ${heroPrimaryCtaLabel}, ${heroSecondaryCtaLabel}, ${aboutBio},
          ${portraitUrl}, ${weeklyVerse}, ${weeklyVerseRef}, ${contactEmail},
          ${location}, ${footerHeading}, ${footerBio}, ${footerCopyright},
          ${footerCredit}, ${hideDemoSermons}, ${hideDemoArticles},
          ${hideDemoPrograms}, ${youtubeUrl}, ${facebookUrl}, ${instagramUrl},
          ${tiktokUrl}, ${xUrl}, ${whatsappUrl}, ${podcastUrl}, ${admin.uid}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          evangelist_name = EXCLUDED.evangelist_name,
          hero_eyebrow = EXCLUDED.hero_eyebrow,
          ministry_tagline = EXCLUDED.ministry_tagline,
          hero_primary_cta_label = EXCLUDED.hero_primary_cta_label,
          hero_secondary_cta_label = EXCLUDED.hero_secondary_cta_label,
          about_bio = EXCLUDED.about_bio,
          portrait_url = EXCLUDED.portrait_url,
          weekly_verse = EXCLUDED.weekly_verse,
          weekly_verse_ref = EXCLUDED.weekly_verse_ref,
          contact_email = EXCLUDED.contact_email,
          location = EXCLUDED.location,
          footer_heading = EXCLUDED.footer_heading,
          footer_bio = EXCLUDED.footer_bio,
          footer_copyright = EXCLUDED.footer_copyright,
          footer_credit = EXCLUDED.footer_credit,
          hide_demo_sermons = EXCLUDED.hide_demo_sermons,
          hide_demo_articles = EXCLUDED.hide_demo_articles,
          hide_demo_programs = EXCLUDED.hide_demo_programs,
          youtube_url = EXCLUDED.youtube_url,
          facebook_url = EXCLUDED.facebook_url,
          instagram_url = EXCLUDED.instagram_url,
          tiktok_url = EXCLUDED.tiktok_url,
          x_url = EXCLUDED.x_url,
          whatsapp_url = EXCLUDED.whatsapp_url,
          podcast_url = EXCLUDED.podcast_url,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
      `;
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'upsert_sermon') {
      const rawId = typeof body.id === 'string' && VALID_ID_RE.test(body.id) ? body.id : makeId('sermon');
      const title = cleanStr(body.title, 140);
      const category =
        typeof body.category === 'string' && VALID_CATEGORIES.has(body.category)
          ? body.category
          : 'Short Sermon';
      const scriptureRef = cleanStr(body.scriptureRef, 80);
      const scriptureQuote = cleanStr(body.scriptureQuote, 400);
      const summary = cleanStr(body.summary, 360);
      const content = cleanStr(body.content, 8000);
      const readTimeMinutes = cleanInt(body.readTimeMinutes, 1, 60, 3);
      const coverImage = cleanStr(body.coverImage, 500);
      const videoUrl = cleanStr(body.videoUrl, 500);
      const isFeatured = Boolean(body.isFeatured);
      const isPublished = body.isPublished !== false;
      const authorName = cleanStr(body.authorName, 80, 'Evangelist Shepherd');

      if (title.length < 3 || scriptureRef.length < 2 || summary.length < 10 || content.length < 20) {
        res.status(400).json({ error: 'Please complete all required sermon fields.' });
        return;
      }

      await sql`
        INSERT INTO sermons (
          id, title, category, scripture_ref, scripture_quote, summary, content,
          read_time_minutes, cover_image, video_url, is_featured, is_published,
          amen_count, pray_count, love_count, view_count, author_id, author_name,
          created_at, updated_at
        ) VALUES (
          ${rawId}, ${title}, ${category}, ${scriptureRef}, ${scriptureQuote},
          ${summary}, ${content}, ${readTimeMinutes}, ${coverImage}, ${videoUrl},
          ${isFeatured}, ${isPublished},
          ${cleanInt(body.amenCount, 0, 10_000_000, 0)},
          ${cleanInt(body.prayCount, 0, 10_000_000, 0)},
          ${cleanInt(body.loveCount, 0, 10_000_000, 0)},
          ${cleanInt(body.viewCount, 0, 10_000_000, 0)},
          ${admin.uid}, ${authorName}, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          scripture_ref = EXCLUDED.scripture_ref,
          scripture_quote = EXCLUDED.scripture_quote,
          summary = EXCLUDED.summary,
          content = EXCLUDED.content,
          read_time_minutes = EXCLUDED.read_time_minutes,
          cover_image = EXCLUDED.cover_image,
          video_url = EXCLUDED.video_url,
          is_featured = EXCLUDED.is_featured,
          is_published = EXCLUDED.is_published,
          author_name = EXCLUDED.author_name,
          updated_at = NOW()
      `;
      res.status(200).json({ ok: true, id: rawId });
      return;
    }

    if (action === 'delete_sermon') {
      const id = typeof body.id === 'string' ? body.id.trim() : '';
      if (!VALID_ID_RE.test(id)) {
        res.status(400).json({ error: 'Invalid sermon ID.' });
        return;
      }
      await sql`DELETE FROM sermons WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'upsert_article') {
      const rawId = typeof body.id === 'string' && VALID_ID_RE.test(body.id) ? body.id : makeId('faith');
      const title = cleanStr(body.title, 140);
      const questionPrompt = cleanStr(body.questionPrompt, 200);
      const topic = cleanStr(body.topic, 60);
      const scriptureRef = cleanStr(body.scriptureRef, 80);
      const excerpt = cleanStr(body.excerpt, 360);
      const content = cleanStr(body.content, 8000);
      const coverImage = cleanStr(body.coverImage, 500);
      const readTimeMinutes = cleanInt(body.readTimeMinutes, 1, 60, 4);
      const isPublished = body.isPublished !== false;
      const authorName = cleanStr(body.authorName, 80, 'Evangelist Shepherd');

      if (
        title.length < 3 ||
        questionPrompt.length < 3 ||
        topic.length < 2 ||
        scriptureRef.length < 2 ||
        excerpt.length < 10 ||
        content.length < 20
      ) {
        res.status(400).json({ error: 'Please complete all required article fields.' });
        return;
      }

      await sql`
        INSERT INTO faith_articles (
          id, title, question_prompt, topic, scripture_ref, excerpt, content,
          cover_image, read_time_minutes, view_count, is_published,
          author_id, author_name, created_at, updated_at
        ) VALUES (
          ${rawId}, ${title}, ${questionPrompt}, ${topic}, ${scriptureRef},
          ${excerpt}, ${content}, ${coverImage}, ${readTimeMinutes},
          ${cleanInt(body.viewCount, 0, 10_000_000, 0)},
          ${isPublished}, ${admin.uid}, ${authorName}, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          question_prompt = EXCLUDED.question_prompt,
          topic = EXCLUDED.topic,
          scripture_ref = EXCLUDED.scripture_ref,
          excerpt = EXCLUDED.excerpt,
          content = EXCLUDED.content,
          cover_image = EXCLUDED.cover_image,
          read_time_minutes = EXCLUDED.read_time_minutes,
          is_published = EXCLUDED.is_published,
          author_name = EXCLUDED.author_name,
          updated_at = NOW()
      `;
      res.status(200).json({ ok: true, id: rawId });
      return;
    }

    if (action === 'delete_article') {
      const id = typeof body.id === 'string' ? body.id.trim() : '';
      if (!VALID_ID_RE.test(id)) {
        res.status(400).json({ error: 'Invalid article ID.' });
        return;
      }
      await sql`DELETE FROM faith_articles WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'upsert_program') {
      const rawId = typeof body.id === 'string' && VALID_ID_RE.test(body.id) ? body.id : makeId('prog');
      const title = cleanStr(body.title, 120);
      const schedule = cleanStr(body.schedule, 120);
      const format = cleanStr(body.format, 80);
      const description = cleanStr(body.description, 500);
      const locationOrLink = cleanStr(body.locationOrLink, 300);
      const isActive = body.isActive !== false;
      const orderIndex = cleanInt(body.orderIndex, 0, 1000, 1);

      if (title.length < 3 || schedule.length < 2 || format.length < 2 || description.length < 10) {
        res.status(400).json({ error: 'Please complete all required program fields.' });
        return;
      }

      await sql`
        INSERT INTO programs (
          id, title, schedule, format, description, location_or_link,
          is_active, order_index, author_id, created_at, updated_at
        ) VALUES (
          ${rawId}, ${title}, ${schedule}, ${format}, ${description},
          ${locationOrLink}, ${isActive}, ${orderIndex}, ${admin.uid}, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          schedule = EXCLUDED.schedule,
          format = EXCLUDED.format,
          description = EXCLUDED.description,
          location_or_link = EXCLUDED.location_or_link,
          is_active = EXCLUDED.is_active,
          order_index = EXCLUDED.order_index,
          updated_at = NOW()
      `;
      res.status(200).json({ ok: true, id: rawId });
      return;
    }

    if (action === 'delete_program') {
      const id = typeof body.id === 'string' ? body.id.trim() : '';
      if (!VALID_ID_RE.test(id)) {
        res.status(400).json({ error: 'Invalid program ID.' });
        return;
      }
      await sql`DELETE FROM programs WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'update_prayer_request') {
      const id = typeof body.id === 'string' ? body.id.trim() : '';
      const status =
        typeof body.status === 'string' && VALID_REQUEST_STATUSES.has(body.status)
          ? body.status
          : 'unread';
      const adminNote = cleanStr(body.adminNote, 1000);
      if (!VALID_ID_RE.test(id)) {
        res.status(400).json({ error: 'Invalid request ID.' });
        return;
      }
      await sql`
        UPDATE prayer_requests
        SET status = ${status}, admin_note = ${adminNote}, updated_at = NOW()
        WHERE id = ${id}
      `;
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'delete_prayer_request') {
      const id = typeof body.id === 'string' ? body.id.trim() : '';
      if (!VALID_ID_RE.test(id)) {
        res.status(400).json({ error: 'Invalid request ID.' });
        return;
      }
      await sql`DELETE FROM prayer_requests WHERE id = ${id}`;
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'replace_all_data') {
      await sql`DELETE FROM sermons`;
      await sql`DELETE FROM faith_articles`;
      await sql`DELETE FROM programs`;
      await sql`DELETE FROM engagement_metrics`;
      await seedFreshContent(sql, admin.uid);
      const s = DEFAULT_MINISTRY_SETTINGS_DATA;
      await sql`
        INSERT INTO ministry_settings (
          id, evangelist_name, hero_eyebrow, ministry_tagline,
          hero_primary_cta_label, hero_secondary_cta_label, about_bio,
          portrait_url, weekly_verse, weekly_verse_ref, contact_email,
          location, footer_heading, footer_bio, footer_copyright,
          footer_credit, hide_demo_sermons, hide_demo_articles,
          hide_demo_programs, youtube_url, facebook_url, instagram_url,
          tiktok_url, x_url, whatsapp_url, podcast_url, updated_by, updated_at
        ) VALUES (
          'main', ${s.evangelistName}, ${s.heroEyebrow}, ${s.ministryTagline},
          ${s.heroPrimaryCtaLabel}, ${s.heroSecondaryCtaLabel}, ${s.aboutBio},
          ${s.portraitUrl}, ${s.weeklyVerse}, ${s.weeklyVerseRef}, ${s.contactEmail},
          ${s.location}, ${s.footerHeading}, ${s.footerBio}, ${s.footerCopyright},
          ${s.footerCredit}, TRUE, TRUE, TRUE,
          ${s.youtubeUrl}, ${s.facebookUrl}, ${s.instagramUrl},
          ${s.tiktokUrl}, ${s.xUrl}, ${s.whatsappUrl}, ${s.podcastUrl}, ${admin.uid}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          ministry_tagline = EXCLUDED.ministry_tagline,
          about_bio = EXCLUDED.about_bio,
          footer_bio = EXCLUDED.footer_bio,
          footer_copyright = EXCLUDED.footer_copyright,
          hide_demo_sermons = TRUE,
          hide_demo_articles = TRUE,
          hide_demo_programs = TRUE,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
      `;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ error: 'Unknown action.' });
  } catch (err) {
    console.error('NeonDB API error:', err);
    res.status(500).json({ error: 'Database request failed.' });
  }
}
