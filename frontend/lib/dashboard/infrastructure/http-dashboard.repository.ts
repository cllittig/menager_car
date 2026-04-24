import { API_ROUTES } from '@/lib/api';
import api from '@/lib/axios';
import type { DashboardStats } from '../domain/dashboard.types';
import { DashboardRepository } from '../domain/repositories/dashboard.repository';

export class HttpDashboardRepository extends DashboardRepository {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>(API_ROUTES.dashboard.stats);
    const d = response.data;
    return {
      ...d,
      topSoldModel: d.topSoldModel ?? null,
      revenueLast6Months: Array.isArray(d.revenueLast6Months) ? d.revenueLast6Months : [],
    };
  }
}
