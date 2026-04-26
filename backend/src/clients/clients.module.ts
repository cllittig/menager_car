import { Module } from '@nestjs/common';
import { ClientsApplicationService } from './application/clients.application-service';
import { ClientRepository } from './domain/repositories/client.repository';
import { SupabaseClientRepository } from './infrastructure/persistence/supabase-client.repository';
import { ClientsController } from './clients.controller';

@Module({
  controllers: [ClientsController],
  providers: [
    { provide: ClientRepository, useClass: SupabaseClientRepository },
    ClientsApplicationService,
  ],
  exports: [ClientsApplicationService],
})
export class ClientsModule {}
