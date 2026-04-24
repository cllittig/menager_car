import { Module } from '@nestjs/common';
import { DashboardApplicationService } from './application/dashboard.application-service';
import { DashboardRepository } from './domain/repositories/dashboard.repository';
import { SupabaseDashboardRepository } from './infrastructure/persistence/supabase-dashboard.repository';
import { DashboardController } from './dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [
    { provide: DashboardRepository, useClass: SupabaseDashboardRepository },
    DashboardApplicationService,
  ],
  exports: [DashboardApplicationService],
})
export class DashboardModule {}
