export abstract class ReportRepository {
  abstract generate(reportType: string, title?: string): Promise<unknown>;

  abstract history(): Promise<unknown>;

  abstract getSnapshot(id: string): Promise<unknown>;

  abstract schedules(): Promise<unknown>;

  abstract createSchedule(body: {
    reportType: string;
    cronExpression: string;
    emailTo: string;
    isActive?: boolean;
  }): Promise<unknown>;

  abstract updateSchedule(
    id: string,
    body: Partial<{ reportType: string; cronExpression: string; emailTo: string; isActive: boolean }>,
  ): Promise<unknown>;

  abstract deleteSchedule(id: string): Promise<unknown>;
}
