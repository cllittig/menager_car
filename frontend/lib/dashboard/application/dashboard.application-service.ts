import { HttpDashboardRepository } from '../infrastructure/http-dashboard.repository';
import { DashboardRepository } from '../domain/repositories/dashboard.repository';

const defaultRepository = new HttpDashboardRepository();

export class DashboardApplicationService {
  constructor(private readonly repository: DashboardRepository = defaultRepository) {}

  async getStats() {
    return this.repository.getStats();
  }
}
