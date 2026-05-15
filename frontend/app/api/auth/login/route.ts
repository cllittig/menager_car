import {
  authHttpOnlyRefreshServer,
  backendBaseUrl,
  cookieSecureFromRequest,
  REFRESH_COOKIE_HP,
  refreshCookieMaxAgeSec,
  stripRefreshFromPayload,
} from '@/lib/server/bff-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${backendBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const payload = stripRefreshFromPayload({ ...data });
  const next = NextResponse.json(payload, { status: res.status });

  if (
    res.ok &&
    typeof data.refreshToken === 'string' &&
    authHttpOnlyRefreshServer()
  ) {
    next.cookies.set(REFRESH_COOKIE_HP, data.refreshToken, {
      httpOnly: true,
      secure: cookieSecureFromRequest(req),
      sameSite: 'lax',
      path: '/',
      maxAge: refreshCookieMaxAgeSec(),
    });
  }

  return next;
}
