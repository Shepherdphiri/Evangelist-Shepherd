import { Timestamp } from 'firebase/firestore';

export type PageRoute = 'home' | 'about' | 'sermons' | 'blog' | 'contact';

export type SermonCategory =
  | 'Short Sermon'
  | 'Midweek Message'
  | 'Word of Encouragement';

export type ReactionType = 'amenCount' | 'prayCount' | 'loveCount';

export type PrayerRequestType =
  | 'Prayer Request'
  | 'Inquiry'
  | 'Testimony'
  | 'General Message';

export type PrayerRequestStatus =
  | 'unread'
  | 'prayed_over'
  | 'replied'
  | 'archived';

export interface Sermon {
  id: string;
  title: string;
  category: SermonCategory;
  scriptureRef: string;
  scriptureQuote: string;
  summary: string;
  content: string;
  readTimeMinutes: number;
  coverImage: string;
  videoUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  amenCount: number;
  prayCount: number;
  loveCount: number;
  viewCount: number;
  authorId: string;
  authorName: string;
  createdAt: Timestamp | Date | null;
  updatedAt: Timestamp | Date | null;
}

export interface FaithArticle {
  id: string;
  title: string;
  questionPrompt: string;
  topic: string;
  scriptureRef: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  readTimeMinutes: number;
  viewCount: number;
  isPublished: boolean;
  authorId: string;
  authorName: string;
  createdAt: Timestamp | Date | null;
  updatedAt: Timestamp | Date | null;
}

export interface MinistryProgram {
  id: string;
  title: string;
  schedule: string;
  format: string;
  description: string;
  locationOrLink: string;
  isActive: boolean;
  orderIndex: number;
  authorId: string;
  createdAt: Timestamp | Date | null;
  updatedAt: Timestamp | Date | null;
}

export interface MinistrySettings {
  evangelistName: string;
  heroEyebrow: string;
  ministryTagline: string;
  heroPrimaryCtaLabel: string;
  heroSecondaryCtaLabel: string;
  aboutBio: string;
  portraitUrl: string;
  weeklyVerse: string;
  weeklyVerseRef: string;
  contactEmail: string;
  location: string;
  footerHeading: string;
  footerBio: string;
  footerCopyright: string;
  footerCredit: string;
  hideDemoSermons: boolean;
  hideDemoArticles: boolean;
  hideDemoPrograms: boolean;
  youtubeUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  xUrl: string;
  whatsappUrl: string;
  podcastUrl: string;
  updatedBy?: string;
  updatedAt?: Timestamp | Date | null;
}

export interface PrayerRequest {
  id: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  requestType: PrayerRequestType;
  subject: string;
  message: string;
  isPrivate: boolean;
  status: PrayerRequestStatus;
  adminNote: string;
  createdAt: Timestamp | Date | null;
  updatedAt: Timestamp | Date | null;
}

export const VALIDATION_LIMITS = {
  idPattern: /^[a-zA-Z0-9_\-]+$/,
  sermon: {
    titleMin: 3,
    titleMax: 140,
    scriptureRefMin: 2,
    scriptureRefMax: 80,
    scriptureQuoteMax: 400,
    summaryMin: 10,
    summaryMax: 360,
    contentMin: 20,
    contentMax: 8000,
    readTimeMin: 1,
    readTimeMax: 60,
    coverImageMax: 500,
    videoUrlMax: 500,
    authorNameMin: 2,
    authorNameMax: 80,
  },
  article: {
    titleMin: 3,
    titleMax: 140,
    questionPromptMin: 3,
    questionPromptMax: 200,
    topicMin: 2,
    topicMax: 60,
    scriptureRefMin: 2,
    scriptureRefMax: 80,
    excerptMin: 10,
    excerptMax: 360,
    contentMin: 20,
    contentMax: 8000,
    coverImageMax: 500,
    readTimeMin: 1,
    readTimeMax: 60,
    authorNameMin: 2,
    authorNameMax: 80,
  },
  program: {
    titleMin: 3,
    titleMax: 120,
    scheduleMin: 2,
    scheduleMax: 120,
    formatMin: 2,
    formatMax: 80,
    descriptionMin: 10,
    descriptionMax: 500,
    locationOrLinkMax: 300,
  },
  settings: {
    evangelistNameMin: 2,
    evangelistNameMax: 80,
    heroEyebrowMin: 2,
    heroEyebrowMax: 100,
    ministryTaglineMin: 4,
    ministryTaglineMax: 160,
    heroCtaMin: 2,
    heroCtaMax: 40,
    aboutBioMin: 10,
    aboutBioMax: 2000,
    portraitUrlMax: 500,
    weeklyVerseMin: 5,
    weeklyVerseMax: 400,
    weeklyVerseRefMin: 2,
    weeklyVerseRefMax: 80,
    contactEmailMax: 120,
    locationMax: 120,
    footerHeadingMin: 2,
    footerHeadingMax: 80,
    footerBioMax: 300,
    footerCopyrightMax: 140,
    footerCreditMax: 120,
    socialUrlMax: 300,
  },
  prayer: {
    senderNameMin: 2,
    senderNameMax: 80,
    senderEmailMax: 120,
    senderPhoneMax: 40,
    subjectMin: 2,
    subjectMax: 140,
    messageMin: 5,
    messageMax: 3000,
    adminNoteMax: 1000,
  },
} as const;

export function truncateText(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export function sanitizeExternalUrl(url: string, max: number): string {
  const trimmed = url.trim().slice(0, max);
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

export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const regex of patterns) {
    const match = url.match(regex);
    if (match && match[1]) return match[1];
  }
  return null;
}

export function getYoutubeEmbedUrl(url: string): string | null {
  const id = extractYoutubeId(url);
  if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return null;
  return `https://www.youtube.com/embed/${id}?rel=0`;
}

export function generateDocumentId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 24) || 'doc';
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 12);
  return `${cleanPrefix}_${Date.now()}_${rand}`.slice(0, 128);
}

export function formatDateValue(value: Timestamp | Date | null | undefined): string {
  if (!value) return 'Recent';
  const date = value instanceof Timestamp ? value.toDate() : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getTimestampMillis(value: Timestamp | Date | null | undefined): number {
  if (!value) return 0;
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return 0;
}
