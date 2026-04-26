import { Module } from '@nestjs/common';
import { ContractsApplicationService } from './application/contracts.application-service';
import { ContractRepository } from './domain/repositories/contract.repository';
import { SupabaseContractRepository } from './infrastructure/persistence/supabase-contract.repository';
import { ContractsController } from './contracts.controller';

@Module({
  controllers: [ContractsController],
  providers: [
    { provide: ContractRepository, useClass: SupabaseContractRepository },
    ContractsApplicationService,
  ],
  exports: [ContractsApplicationService],
})
export class ContractsModule {}
