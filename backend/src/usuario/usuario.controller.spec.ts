import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioApplicationService } from './application/usuario.application-service';
import { UsuarioRepository } from './domain/repositories/usuario.repository';
import { UsuarioController } from './usuario.controller';

describe('UsuarioController', () => {
  let controller: UsuarioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuarioController],
      providers: [
        UsuarioApplicationService,
        {
          provide: UsuarioRepository,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<UsuarioController>(UsuarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
