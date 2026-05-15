

export const CLIENT_GPS_COOKIE = 'client_gps';


export const CLIENT_GPS_MAX_AGE_SEC = 4 * 60 * 60;

export type ClientGpsPayload = {
  lat: number;
  lng: number;
  acc?: number;
  t: number;
};

export function parseClientGpsCookie(raw: string | undefined): string {
  if (!raw) {
    return '';
  }
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    const lat = p.lat;
    const lng = p.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return '';
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return '';
    }
    const acc = p.acc;
    const accPart =
      typeof acc === 'number' && Number.isFinite(acc)
        ? ` precisao~${Math.round(acc)}m`
        : '';
    return `${lat},${lng}${accPart}`;
  } catch {
    return '';
  }
}
