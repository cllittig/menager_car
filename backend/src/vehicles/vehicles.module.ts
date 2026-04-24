import { Module } from '@nestjs/common';
import { VehiclesApplicationService } from './application/vehicles.application-service';
import { VehicleRepository } from './domain/repositories/vehicle.repository';
import { SupabaseVehicleRepository } from './infrastructure/persistence/supabase-vehicle.repository';
import { VehiclesController } from './vehicles.controller';

@Module({
  controllers: [VehiclesController],
  providers: [
    { provide: VehicleRepository, useClass: SupabaseVehicleRepository },
    VehiclesApplicationService,
  ],
  exports: [VehiclesApplicationService],
})
export class VehiclesModule {}
