import { User } from 'firebase/auth';
import {
  FaithArticle,
  MinistryProgram,
  MinistrySettings,
  PrayerRequest,
  Sermon,
} from '../types/ministry';

export interface NeonBootstrapResponse {
  enabled: boolean;
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

export async function fetchNeonBootstrap(
  user?: User | null
): Promise<NeonBootstrapResponse> {
  try {
    const headers: Record<string, string> = {};
    if (user) {
      const token = await user.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch('/api/neondb?action=bootstrap', {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return { enabled: false };
    }
    const data = (await res.json()) as NeonBootstrapResponse;
    return data && data.enabled ? data : { enabled: false };
  } catch {
    return { enabled: false };
  }
}

export async function fetchNeonInbox(user: User): Promise<PrayerRequest[]> {
  const token = await user.getIdToken();
  const res = await fetch('/api/neondb?action=inbox', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch('/api/neondb', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...payload }),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Database request failed.');
  }
  return data;
}
