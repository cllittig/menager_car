import { isLanOrLoopback } from '@/lib/client-ip';

type CacheEntry = { at: number; label: string };

const TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 3_500;
const MAX_CACHE_ENTRIES = 500;

const cache = new Map<string, CacheEntry>();

function cacheSet(ip: string, label: string): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const first = cache.keys().next().value;
    if (first !== undefined) {
      cache.delete(first);
    }
  }
  cache.set(ip, { at: Date.now(), label });
}

type IpWhoPayload = {
  success?: boolean;
  city?: string;
  region?: string;
  region_code?: string;
  country?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
};

function countryDisplay(
  countryCode: string | undefined,
  countryName: string | undefined,
): string {
  if (countryCode === 'BR') {
    return 'Brasil';
  }
  if (countryName) {
    return countryName;
  }
  return countryCode ?? '?';
}


function formatIpWhoLabel(data: IpWhoPayload): string {
  const city = (data.city ?? '').trim() || '?';
  const state = (data.region_code ?? data.region ?? '').trim() || '?';
  const country = countryDisplay(data.country_code, data.country);
  return `${city} - ${state} | ${country}`;
}

/**
 * Geolocalização aproximada pelo IP (operadora / NAT). Não é GPS do aparelho.
 */
export async function lookupIpGeoLabel(ip: string): Promise<string> {
  if (ip === 'desconhecido' || isLanOrLoopback(ip)) {
    return '';
  }

  const now = Date.now();
  const hit = cache.get(ip);
  if (hit && now - hit.at < TTL_MS) {
    return hit.label;
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`https://ipwho.is/${ip}`, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);

    if (!res.ok) {
      const label = '? - ? | geo indisponível (HTTP)';
      cacheSet(ip, label);
      return label;
    }

    const data = (await res.json()) as IpWhoPayload;
    if (!data.success) {
      const label = '? - ? | geo indisponível (API)';
      cacheSet(ip, label);
      return label;
    }

    const label = formatIpWhoLabel(data);
    cacheSet(ip, label);
    return label;
  } catch {
    const label = '? - ? | geo indisponível (rede)';
    cacheSet(ip, label);
    return label;
  }
}
