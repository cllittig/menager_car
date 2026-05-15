import { HttpReportRepository } from '../infrastructure/http-report.repository';
import { ReportRepository } from '../domain/repositories/report.repository';

const defaultRepository = new HttpReportRepository();

export class ReportsApplicationService {
  constructor(private readonly repository: ReportRepository = defaultRepository) {}

  generate(reportType: string, title?: string) {
    return this.repository.generate(reportType, title);
  }

  history() {
    return this.repository.history();
  }

  getSnapshot(id: string) {
    return this.repository.getSnapshot(id);
  }

  schedules() {
    return this.repository.schedules();
  }

  createSchedule(body: Parameters<ReportRepository['createSchedule']>[0]) {
    return this.repository.createSchedule(body);
  }

  updateSchedule(id: string, body: Parameters<ReportRepository['updateSchedule']>[1]) {
    return this.repository.updateSchedule(id, body);
  }

  deleteSchedule(id: string) {
    return this.repository.deleteSchedule(id);
  }
}
