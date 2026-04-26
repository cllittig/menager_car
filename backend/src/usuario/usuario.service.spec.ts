import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioApplicationService } from './application/usuario.application-service';
import { UsuarioRepository } from './domain/repositories/usuario.repository';

describe('UsuarioApplicationService', () => {
  let service: UsuarioApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioApplicationService,
        {
          provide: UsuarioRepository,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get(UsuarioApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
