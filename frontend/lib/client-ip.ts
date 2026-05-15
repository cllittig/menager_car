import type { NextRequest } from 'next/server';

function normalizeIp(raw: string): string {
  const t = raw.trim();
  return t.replace(/^::ffff:/i, '');
}




export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) {
      return normalizeIp(first);
    }
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return normalizeIp(realIp);
  }
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) {
    return normalizeIp(cf);
  }
  const withIp = request as NextRequest & { ip?: string };
  if (withIp.ip) {
    return normalizeIp(withIp.ip);
  }
  return 'desconhecido';
}

export function isLanOrLoopback(ip: string): boolean {
  if (ip === 'desconhecido') {
    return true;
  }
  if (ip === '::1' || ip === '127.0.0.1') {
    return true;
  }
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 10) {
      return true;
    }
    if (a === 172 && b >= 16 && b <= 31) {
      return true;
    }
    if (a === 192 && b === 168) {
      return true;
    }
    if (a === 169 && b === 254) {
      return true;
    }
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower.startsWith('fe80:')) {
    return true;
  }
  if (lower.startsWith('fc') || lower.startsWith('fd')) {
    return true;
  }
  return false;
}
