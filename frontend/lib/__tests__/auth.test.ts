import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore: Record<string, string> = {};
const mockSessionStorage: Record<string, string> = {};
const mockLocalStorage: Record<string, string> = {};

vi.mock('js-cookie', () => ({
  default: {
    get: (key: string) => cookieStore[key],
    set: (key: string, value: string) => { cookieStore[key] = value; },
    remove: (key: string) => { delete cookieStore[key]; },
  },
}));

beforeEach(() => {
  Object.keys(cookieStore).forEach((k) => { delete cookieStore[k]; });
  Object.keys(mockSessionStorage).forEach((k) => { delete mockSessionStorage[k]; });
  Object.keys(mockLocalStorage).forEach((k) => { delete mockLocalStorage[k]; });

  Object.defineProperty(globalThis, 'window', {
    value: {
      location: { protocol: 'https:', hostname: 'localhost' },
    },
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'sessionStorage', {
    value: {
      getItem: (k: string) => mockSessionStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockSessionStorage[k] = v; },
      removeItem: (k: string) => { delete mockSessionStorage[k]; },
    },
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => mockLocalStorage[k] ?? null,
      setItem: (k: string, v: string) => { mockLocalStorage[k] = v; },
      removeItem: (k: string) => { delete mockLocalStorage[k]; },
    },
    writable: true,
    configurable: true,
  });

  vi.resetModules();
  delete process.env.NEXT_PUBLIC_COOKIE_SECURE;
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function importAuth() {
  return import('../auth');
}

describe('saveToken / getToken', () => {
  it('salva access token em cookie e sessionStorage', async () => {
    const { saveToken, getToken } = await importAuth();
    saveToken('my-access-token');
    const token = getToken();
    expect(token).toBe('my-access-token');
  });

  it('salva refresh token junto ao access token quando fornecido', async () => {
    const { saveToken, getRefreshToken } = await importAuth();
    saveToken('access-tok', 'refresh-tok');
    expect(getRefreshToken()).toBe('refresh-tok');
  });

  it('retorna undefined quando nenhum token está salvo', async () => {
    const { getToken } = await importAuth();
    expect(getToken()).toBeUndefined();
  });

  it('retorna undefined no lado servidor (window undefined)', async () => {
    Object.defineProperty(globalThis, 'window', { value: undefined, writable: true, configurable: true });
    vi.resetModules();
    const { getToken } = await importAuth();
    expect(getToken()).toBeUndefined();
  });

  it('migra token do localStorage para cookie + sessionStorage', async () => {
    mockLocalStorage['token'] = 'legacy-token';
    const { getToken } = await importAuth();

    const token = getToken();
    expect(token).toBe('legacy-token');
    expect(mockLocalStorage['token']).toBeUndefined();
  });
});

describe('removeToken', () => {
  it('limpa token de todos os storages', async () => {
    const { saveToken, removeToken, getToken } = await importAuth();
    saveToken('tok', 'ref');
    removeToken();
    expect(getToken()).toBeUndefined();
  });
});

describe('isAuthenticated', () => {
  it('retorna false quando sem token', async () => {
    const { isAuthenticated } = await importAuth();
    expect(isAuthenticated()).toBe(false);
  });

  it('retorna true quando token está presente', async () => {
    const { saveToken, isAuthenticated } = await importAuth();
    saveToken('valid-token');
    expect(isAuthenticated()).toBe(true);
  });
});

describe('isTokenExpiringSoon', () => {
  it('retorna true para token inválido ou ausente', async () => {
    const { isTokenExpiringSoon } = await importAuth();
    expect(isTokenExpiringSoon('invalid-token')).toBe(true);
    expect(isTokenExpiringSoon(undefined)).toBe(true);
  });

  it('retorna false para token com exp > 5 minutos', async () => {
    const { isTokenExpiringSoon } = await importAuth();
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({ sub: '1', exp }));
    const token = `header.${payload}.sig`;
    expect(isTokenExpiringSoon(token)).toBe(false);
  });

  it('retorna true para token expirando em menos de 5 minutos', async () => {
    const { isTokenExpiringSoon } = await importAuth();
    const exp = Math.floor(Date.now() / 1000) + 60;
    const payload = btoa(JSON.stringify({ sub: '1', exp }));
    const token = `header.${payload}.sig`;
    expect(isTokenExpiringSoon(token)).toBe(true);
  });

  it('retorna false para token sem campo exp', async () => {
    const { isTokenExpiringSoon } = await importAuth();
    const payload = btoa(JSON.stringify({ sub: '1' }));
    const token = `header.${payload}.sig`;
    expect(isTokenExpiringSoon(token)).toBe(false);
  });
});

describe('clearClientRefreshStorage', () => {
  it('remove refresh token de cookie, sessionStorage e localStorage', async () => {
    const { saveToken, clearClientRefreshStorage, getRefreshToken } = await importAuth();
    saveToken('acc', 'ref');
    clearClientRefreshStorage();
    expect(getRefreshToken()).toBeUndefined();
  });
});
