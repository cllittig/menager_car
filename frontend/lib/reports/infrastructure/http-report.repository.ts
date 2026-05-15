import { API_ROUTES } from '@/lib/api';
import api from '@/lib/axios';
import { ReportRepository } from '../domain/repositories/report.repository';

export class HttpReportRepository extends ReportRepository {
  generate(reportType: string, title?: string) {
    return api.post(API_ROUTES.reports.generate, { reportType, title }).then((r) => r.data);
  }

  history() {
    return api.get(API_ROUTES.reports.history).then((r) => r.data);
  }

  getSnapshot(id: string) {
    return api.get(API_ROUTES.reports.historyOne(id)).then((r) => r.data);
  }

  schedules() {
    return api.get(API_ROUTES.reports.schedules).then((r) => r.data);
  }

  createSchedule(body: {
    reportType: string;
    cronExpression: string;
    emailTo: string;
    isActive?: boolean;
  }) {
    return api.post(API_ROUTES.reports.schedules, body).then((r) => r.data);
  }

  updateSchedule(
    id: string,
    body: Partial<{ reportType: string; cronExpression: string; emailTo: string; isActive: boolean }>,
  ) {
    return api.patch(API_ROUTES.reports.scheduleOne(id), body).then((r) => r.data);
  }

  deleteSchedule(id: string) {
    return api.delete(API_ROUTES.reports.scheduleOne(id)).then((r) => r.data);
  }
}
