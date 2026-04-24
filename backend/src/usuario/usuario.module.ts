import { Module } from '@nestjs/common';
import { UsuarioApplicationService } from './application/usuario.application-service';
import { UsuarioRepository } from './domain/repositories/usuario.repository';
import { SupabaseUsuarioRepository } from './infrastructure/persistence/supabase-usuario.repository';
import { UsuarioController } from './usuario.controller';

@Module({
  controllers: [UsuarioController],
  providers: [
    { provide: UsuarioRepository, useClass: SupabaseUsuarioRepository },
    UsuarioApplicationService,
  ],
  exports: [UsuarioApplicationService],
})
export class UsuarioModule {}
