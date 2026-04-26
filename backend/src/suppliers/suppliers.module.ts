import { Module } from '@nestjs/common';
import { SuppliersApplicationService } from './application/suppliers.application-service';
import { SupplierRepository } from './domain/repositories/supplier.repository';
import { SupabaseSupplierRepository } from './infrastructure/persistence/supabase-supplier.repository';
import { SuppliersController } from './suppliers.controller';

@Module({
  controllers: [SuppliersController],
  providers: [
    { provide: SupplierRepository, useClass: SupabaseSupplierRepository },
    SuppliersApplicationService,
  ],
  exports: [SuppliersApplicationService],
})
export class SuppliersModule {}
