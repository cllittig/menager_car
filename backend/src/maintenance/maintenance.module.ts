import { Module } from '@nestjs/common';
import { MaintenanceApplicationService } from './application/maintenance.application-service';
import { MaintenanceRepository } from './domain/repositories/maintenance.repository';
import { SupabaseMaintenanceRepository } from './infrastructure/persistence/supabase-maintenance.repository';
import { MaintenanceController } from './maintenance.controller';

@Module({
  controllers: [MaintenanceController],
  providers: [
    { provide: MaintenanceRepository, useClass: SupabaseMaintenanceRepository },
    MaintenanceApplicationService,
  ],
  exports: [MaintenanceApplicationService],
})
export class MaintenanceModule {}
