import { Module } from '@nestjs/common';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ReportsApplicationService } from './application/reports.application-service';
import { ReportRepository } from './domain/repositories/report.repository';
import { SupabaseReportRepository } from './infrastructure/persistence/supabase-report.repository';
import { ReportsController } from './reports.controller';

@Module({
  imports: [DashboardModule],
  controllers: [ReportsController],
  providers: [
    { provide: ReportRepository, useClass: SupabaseReportRepository },
    ReportsApplicationService,
  ],
  exports: [ReportsApplicationService],
})
export class ReportsModule {}
