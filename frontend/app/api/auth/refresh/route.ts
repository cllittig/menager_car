import {
  authHttpOnlyRefreshServer,
  backendBaseUrl,
  cookieSecureFromRequest,
  REFRESH_COOKIE_HP,
  refreshCookieMaxAgeSec,
} from '@/lib/server/bff-auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  if (typeof body.refreshToken !== 'string' || !body.refreshToken.length) {
    const jar = await cookies();
    const fromCookie = jar.get(REFRESH_COOKIE_HP)?.value;
    if (fromCookie) {
      body = { ...body, refreshToken: fromCookie };
    }
  }

  const res = await fetch(`${backendBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (
    res.ok &&
    typeof data.refreshToken === 'string' &&
    authHttpOnlyRefreshServer()
  ) {
    const { refreshToken: _rt, ...rest } = data;
    void _rt;
    const next = NextResponse.json(rest, { status: res.status });
    next.cookies.set(REFRESH_COOKIE_HP, data.refreshToken as string, {
      httpOnly: true,
      secure: cookieSecureFromRequest(req),
      sameSite: 'lax',
      path: '/',
      maxAge: refreshCookieMaxAgeSec(),
    });
    return next;
  }

  return NextResponse.json(data, { status: res.status });
}
