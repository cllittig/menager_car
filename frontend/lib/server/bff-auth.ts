

import { getServerApiBaseUrl } from '@/lib/env';

export const REFRESH_COOKIE_HP = 'refresh_token_hp';





export function cookieSecureFromRequest(req: Request): boolean {
  if (process.env.COOKIE_SECURE === 'true') {
    return true;
  }
  if (process.env.COOKIE_SECURE === 'false') {
    return false;
  }
  const proto = req.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim();
  if (proto === 'https') {
    return true;
  }
  if (proto === 'http') {
    return false;
  }
  try {
    return new URL(req.url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function backendBaseUrl(): string {
  return getServerApiBaseUrl();
}

export function authHttpOnlyRefreshServer(): boolean {
  return process.env.AUTH_HTTPONLY_REFRESH === 'true';
}

export function refreshCookieMaxAgeSec(): number {
  const d = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '30', 10);
  return Math.max(1, d) * 24 * 60 * 60;
}

export function stripRefreshFromPayload(
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (!authHttpOnlyRefreshServer()) {
    return data;
  }
  const { refreshToken: _rt, ...rest } = data;
  void _rt;
  return rest;
}
