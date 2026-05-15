import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  delete process.env.NEXT_PUBLIC_API_URL;
  delete process.env.INTERNAL_API_URL;
  delete process.env.NEXT_PUBLIC_API_SAME_ORIGIN;
  delete process.env.NEXT_PUBLIC_API_DYNAMIC_HOST;
  delete process.env.NEXT_PUBLIC_API_PORT;
  (process.env as Record<string, string | undefined>).NODE_ENV = undefined;
  Object.defineProperty(globalThis, 'window', { value: undefined, writable: true, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function importEnv() {
  return import('../env');
}

describe('getFrontendApiBaseUrl — ambiente servidor (sem window)', () => {
  it('usa INTERNAL_API_URL quando definida (SSR)', async () => {
    process.env.INTERNAL_API_URL = 'http://backend:3005';
    const { getFrontendApiBaseUrl } = await importEnv();
    expect(getFrontendApiBaseUrl()).toBe('http://backend:3005');
  });

  it('usa NEXT_PUBLIC_API_URL quando INTERNAL_API_URL está ausente', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.example:3005/';
    const { getFrontendApiBaseUrl } = await importEnv();
    expect(getFrontendApiBaseUrl()).toBe('http://api.example:3005');
  });

  it('remove barra final da URL', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.example:3005/';
    const { getFrontendApiBaseUrl } = await importEnv();
    expect(getFrontendApiBaseUrl()).not.toMatch(/\/$/);
  });

  it('retorna localhost:3005 como fallback quando nenhuma env está definida', async () => {
    const { getFrontendApiBaseUrl } = await importEnv();
    expect(getFrontendApiBaseUrl()).toBe('http://localhost:3005');
  });

  it('INTERNAL_API_URL tem prioridade sobre NEXT_PUBLIC_API_URL', async () => {
    process.env.INTERNAL_API_URL = 'http://internal:3005';
    process.env.NEXT_PUBLIC_API_URL = 'http://public:3005';
    const { getFrontendApiBaseUrl } = await importEnv();
    expect(getFrontendApiBaseUrl()).toBe('http://internal:3005');
  });
});

describe('getFrontendApiBaseUrl — modo browser com NEXT_PUBLIC_API_SAME_ORIGIN', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: { location: { protocol: 'https:', hostname: 'meusite.com' } },
      writable: true,
      configurable: true,
    });
  });

  it('retorna /api quando NEXT_PUBLIC_API_SAME_ORIGIN=true no browser', async () => {
    process.env.NEXT_PUBLIC_API_SAME_ORIGIN = 'true';
    vi.resetModules();
    const { getFrontendApiBaseUrl } = await importEnv();
    expect(getFrontendApiBaseUrl()).toBe('/api');
  });
});

describe('getFrontendApiBaseUrl — modo dinâmico no browser', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: { location: { protocol: 'http:', hostname: '192.168.1.10' } },
      writable: true,
      configurable: true,
    });
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
  });

  it('usa hostname da página + porta padrão 3005 em dev', async () => {
    vi.resetModules();
    const { getFrontendApiBaseUrl } = await importEnv();
    expect(getFrontendApiBaseUrl()).toBe('http://192.168.1.10:3005');
  });

  it('usa NEXT_PUBLIC_API_PORT quando definida', async () => {
    process.env.NEXT_PUBLIC_API_PORT = '4000';
    vi.resetModules();
    const { getFrontendApiBaseUrl } = await importEnv();
    expect(getFrontendApiBaseUrl()).toBe('http://192.168.1.10:4000');
  });

  it('NEXT_PUBLIC_API_DYNAMIC_HOST=false desabilita modo dinâmico', async () => {
    process.env.NEXT_PUBLIC_API_DYNAMIC_HOST = 'false';
    process.env.NEXT_PUBLIC_API_URL = 'http://fixed.api:3005';
    vi.resetModules();
    const { getFrontendApiBaseUrl } = await importEnv();
    expect(getFrontendApiBaseUrl()).toBe('http://fixed.api:3005');
  });
});

describe('getServerApiBaseUrl', () => {
  it('usa INTERNAL_API_URL no servidor', async () => {
    process.env.INTERNAL_API_URL = 'http://backend:3005';
    const { getServerApiBaseUrl } = await importEnv();
    expect(getServerApiBaseUrl()).toBe('http://backend:3005');
  });

  it('fallback para localhost:3005 quando sem env', async () => {
    const { getServerApiBaseUrl } = await importEnv();
    expect(getServerApiBaseUrl()).toBe('http://localhost:3005');
  });
});
