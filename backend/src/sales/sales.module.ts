import { Module } from '@nestjs/common';
import { SalesApplicationService } from './application/sales.application-service';
import { SaleRepository } from './domain/repositories/sale.repository';
import { SupabaseSaleRepository } from './infrastructure/persistence/supabase-sale.repository';
import { SalesController } from './sales.controller';

@Module({
  controllers: [SalesController],
  providers: [
    { provide: SaleRepository, useClass: SupabaseSaleRepository },
    SalesApplicationService,
  ],
  exports: [SalesApplicationService],
})
export class SalesModule {}
