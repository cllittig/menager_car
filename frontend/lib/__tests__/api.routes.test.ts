import { afterEach, describe, expect, it, vi } from 'vitest';

describe('API_ROUTES (contrato frontend com backend)', () => {
  const original = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (original !== undefined) {
      process.env.NEXT_PUBLIC_API_URL = original;
    } else {
      delete process.env.NEXT_PUBLIC_API_URL;
    }
    vi.resetModules();
  });

  it('monta URLs do dashboard, veículos, vendas e relatórios com base na API', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.example:3005';
    vi.resetModules();
    const { API_ROUTES } = await import('../api');

    expect(API_ROUTES.dashboard.stats).toBe('http://api.example:3005/dashboard/stats');
    expect(API_ROUTES.vehicles.create).toBe('http://api.example:3005/vehicles');
    expect(API_ROUTES.clients.create).toBe('http://api.example:3005/clients');
    expect(API_ROUTES.sales.create).toBe('http://api.example:3005/sales');
    expect(API_ROUTES.maintenance.create).toBe('http://api.example:3005/maintenance');
    expect(API_ROUTES.contracts.create).toBe('http://api.example:3005/contracts');
    expect(API_ROUTES.categories.create).toBe('http://api.example:3005/categories');
    expect(API_ROUTES.suppliers.create).toBe('http://api.example:3005/suppliers');
    expect(API_ROUTES.products.create).toBe('http://api.example:3005/products');
    expect(API_ROUTES.reports.generate).toBe('http://api.example:3005/reports/generate');
    expect(API_ROUTES.reports.schedules).toBe('http://api.example:3005/reports/schedules');
    expect(API_ROUTES.auth.login).toBe('http://api.example:3005/auth/login');
  });

  it('usa localhost:3005 quando NEXT_PUBLIC_API_URL não está definida', async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    vi.resetModules();
    const { API_ROUTES } = await import('../api');
    expect(API_ROUTES.dashboard.stats).toBe('http://localhost:3005/dashboard/stats');
  });
});
