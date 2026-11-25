import { User } from 'firebase/auth';
import {
  FaithArticle,
  MinistryProgram,
  MinistrySettings,
  PrayerRequest,
  Sermon,
} from '../types/ministry';

const ADMIN_SESSION_TOKEN_KEY = 'evangelist_admin_session_token_v1';

export interface NeonBootstrapResponse {
  enabled: boolean;
  passwordAuthConfigured?: boolean;
  isAdminSession?: boolean;
  settings?: MinistrySettings;
  sermons?: Sermon[];
  articles?: FaithArticle[];
  programs?: MinistryProgram[];
  engagementMetrics?: Record<
    string,
    {
      viewCount: number;
      amenCount: number;
      prayCount: number;
      loveCount: number;
    }
  >;
}

export function getStoredAdminToken(): string {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredAdminToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(ADMIN_SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
    }
  } catch {
    // ignore sessionStorage errors
  }
}

async function buildAuthHeaders(
  user?: User | null,
  extra?: Record<string, string>
): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...(extra || {}) };
  const sessionToken = getStoredAdminToken();
  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  } else if (user) {
    try {
      const fbToken = await user.getIdToken();
      headers.Authorization = `Bearer ${fbToken}`;
    } catch {
      // ignore token read failure
    }
  }
  return headers;
}

export async function fetchNeonBootstrap(
  user?: User | null
): Promise<NeonBootstrapResponse> {
  try {
    const headers = await buildAuthHeaders(user);
    const res = await fetch('/api/neondb?action=bootstrap', {
      method: 'GET',
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return { enabled: false };
    }
    const data = (await res.json()) as NeonBootstrapResponse;
    return {
      enabled: Boolean(data?.enabled),
      passwordAuthConfigured: Boolean(data?.passwordAuthConfigured),
      isAdminSession: Boolean(data?.isAdminSession),
      settings: data?.settings,
      sermons: data?.sermons,
      articles: data?.articles,
      programs: data?.programs,
      engagementMetrics: data?.engagementMetrics,
    };
  } catch {
    return { enabled: false };
  }
}

export async function loginNeonAdmin(password: string): Promise<void> {
  const res = await fetch('/api/neondb', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ action: 'admin_login', password }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    sessionToken?: string;
    error?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Incorrect admin password.');
  }
  if (data.sessionToken) {
    setStoredAdminToken(data.sessionToken);
  }
}

export async function logoutNeonAdmin(): Promise<void> {
  setStoredAdminToken(null);
  try {
    await fetch('/api/neondb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'admin_logout' }),
    });
  } catch {
    // ignore network error on logout
  }
}

export async function fetchNeonInbox(user?: User | null): Promise<PrayerRequest[]> {
  const headers = await buildAuthHeaders(user);
  const res = await fetch('/api/neondb?action=inbox', {
    method: 'GET',
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as {
    requests?: PrayerRequest[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch inbox from NeonDB.');
  }
  return Array.isArray(data.requests) ? data.requests : [];
}

export async function postNeonAction<T = { ok: boolean; id?: string }>(
  action: string,
  payload: Record<string, unknown>,
  user?: User | null
): Promise<T> {
  const headers = await buildAuthHeaders(user, {
    'Content-Type': 'application/json',
  });
  const res = await fetch('/api/neondb', {
    method: 'POST',
    headers,
    credentials: 'same-origin',
    body: JSON.stringify({ action, ...payload }),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Database request failed.');
  }
  return data;
}

export async function uploadImageToNeon(
  dataUrl: string,
  user?: User | null
): Promise<string> {
  const data = await postNeonAction<{ ok: boolean; url: string }>(
    'upload_image',
    { dataUrl },
    user
  );
  if (!data.url) {
    throw new Error('Image upload did not return a URL.');
  }
  return data.url;
}
