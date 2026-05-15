import {
  backendBaseUrl,
  cookieSecureFromRequest,
  REFRESH_COOKIE_HP,
} from '@/lib/server/bff-auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let refreshToken: string | undefined;
  try {
    const b = await req.json();
    refreshToken = typeof b?.refreshToken === 'string' ? b.refreshToken : undefined;
  } catch {

  }

  if (!refreshToken) {
    const jar = await cookies();
    refreshToken = jar.get(REFRESH_COOKIE_HP)?.value;
  }

  if (refreshToken) {
    await fetch(`${backendBaseUrl()}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
  }

  const next = NextResponse.json({ statusCode: 200, message: 'Logout ok' });
  // Sempre expirar o cookie HttpOnly (evita loop proxy: sessão “fantasma” só com refresh).
  next.cookies.set(REFRESH_COOKIE_HP, '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecureFromRequest(req),
  });
  return next;
}
