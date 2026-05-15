import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioApplicationService } from './application/usuario.application-service';
import { UsuarioRepository } from './domain/repositories/usuario.repository';
import { UsuarioController } from './usuario.controller';
import { SupabaseService } from '../supabase/supabase.service';

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
        {
          provide: SupabaseService,
          useValue: {
            getClient: jest.fn().mockReturnValue({
              auth: {
                admin: {
                  createUser: jest.fn(),
                  deleteUser: jest.fn(),
                },
              },
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<UsuarioController>(UsuarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
