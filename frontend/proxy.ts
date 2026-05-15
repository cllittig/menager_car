import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  CLIENT_GPS_COOKIE,
  parseClientGpsCookie,
} from '@/lib/client-gps-cookie';
import { getClientIp, isLanOrLoopback } from '@/lib/client-ip';
import { lookupIpGeoLabel } from '@/lib/ip-geo';

const ACCESS_LOG_SILENT = process.env.ACCESS_LOG_SILENT === 'true';
const ACCESS_LOG_GEO = process.env.ACCESS_LOG_GEO !== 'false';

function shouldLogRequestPath(pathname: string): boolean {
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return false;
  }
  if (
    /\.(ico|png|jpe?g|gif|webp|svg|css|js|map|woff2?|ttf|eot|json)$/i.test(
      pathname,
    )
  ) {
    return false;
  }
  return true;
}





const CLIENT_MAC_HEADER = 'x-client-mac';


export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!ACCESS_LOG_SILENT && shouldLogRequestPath(pathname)) {
    const ip = getClientIp(request);
    const escopo = isLanOrLoopback(ip) ? 'LAN' : 'WAN';

    const mac = request.headers.get(CLIENT_MAC_HEADER)?.trim() || 'n/d';
    let geo = '';
    if (escopo === 'WAN' && ACCESS_LOG_GEO) {
      geo = await lookupIpGeoLabel(ip);
    }
    const geoGps = parseClientGpsCookie(
      request.cookies.get(CLIENT_GPS_COOKIE)?.value,
    );
    const localPart = geo ? ` local=${geo}` : '';
    const geoGpsPart = geoGps ? ` geo_gps=${geoGps}` : '';
    console.log(
      `[acesso ${escopo}] ${request.method} ${pathname} ip=${ip}${localPart}${geoGpsPart} mac=${mac}`,
    );
  }

  const token = request.cookies.get('token')?.value;
  const refreshHp =
    process.env.NEXT_PUBLIC_AUTH_USE_HTTPONLY_REFRESH === 'true'
      ? request.cookies.get('refresh_token_hp')?.value
      : undefined;

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password');

  const isPublicFile =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon');

  if (isPublicFile) {
    return NextResponse.next();
  }

  const hasSession = Boolean(token) || Boolean(refreshHp);

  if (!hasSession && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isAuthPage) {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
