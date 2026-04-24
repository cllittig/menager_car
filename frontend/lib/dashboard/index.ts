export type { DashboardStats } from './domain/dashboard.types';
export { DashboardRepository } from './domain/repositories/dashboard.repository';
export { HttpDashboardRepository } from './infrastructure/http-dashboard.repository';
export { DashboardApplicationService } from './application/dashboard.application-service';
export { dashboardKeys, useDashboardStats } from './application/use-dashboard-stats';
