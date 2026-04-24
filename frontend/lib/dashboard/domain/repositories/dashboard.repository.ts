import type { DashboardStats } from '../dashboard.types';

export abstract class DashboardRepository {
  abstract getStats(): Promise<DashboardStats>;
}
