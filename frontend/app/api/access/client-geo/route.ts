import {
  CLIENT_GPS_COOKIE,
  CLIENT_GPS_MAX_AGE_SEC,
  type ClientGpsPayload,
} from '@/lib/client-gps-cookie';
import { cookieSecureFromRequest } from '@/lib/server/bff-auth';
import { NextResponse } from 'next/server';

function validCoords(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const lat = o.latitude;
  const lng = o.longitude;
  const accRaw = o.accuracy;

  if (!validCoords(lat, lng)) {
    return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
  }

  const safeLat = lat as number;
  const safeLng = lng as number;

  let acc: number | undefined;
  if (typeof accRaw === 'number' && Number.isFinite(accRaw) && accRaw >= 0) {
    acc = accRaw;
  }

  const payload: ClientGpsPayload = {
    lat: safeLat,
    lng: safeLng,
    ...(acc !== undefined ? { acc } : {}),
    t: Date.now(),
  };

  const res = NextResponse.json({ ok: true });
  res.cookies.set(CLIENT_GPS_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: cookieSecureFromRequest(req),
    sameSite: 'lax',
    path: '/',
    maxAge: CLIENT_GPS_MAX_AGE_SEC,
  });
  return res;
}
