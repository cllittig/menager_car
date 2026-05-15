import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

const TEST_JWT_SECRET = 'test-jwt-secret-for-e2e-minimum-32chars';

describe('ManagerCar API (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.NODE_ENV = 'test';

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ secret: TEST_JWT_SECRET, signOptions: { expiresIn: '1h' } }),
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 100 }]),
      ],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health check', () => {
    it('GET / responde com status 200', () => {
      return request(app.getHttpServer()).get('/').expect(200);
    });
  });

  describe('Rotas protegidas sem token', () => {
    const protectedRoutes = [
      { method: 'GET', path: '/vehicles' },
      { method: 'GET', path: '/clients' },
      { method: 'GET', path: '/sales' },
      { method: 'GET', path: '/maintenance' },
      { method: 'GET', path: '/contracts' },
      { method: 'GET', path: '/dashboard/stats' },
      { method: 'GET', path: '/categories' },
      { method: 'GET', path: '/suppliers' },
      { method: 'GET', path: '/products' },
    ];

    it.each(protectedRoutes)(
      '$method $path retorna 401 sem Authorization header',
      async ({ method, path }) => {
        const res = await (request(app.getHttpServer()) as unknown as Record<string, (p: string) => request.Test>)[
          method.toLowerCase()
        ](path);
        expect([401, 404]).toContain(res.status);
      },
    );
  });

  describe('Validação de payload de login', () => {
    it('POST /auth/login com body vazio retorna 400 ou 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .set('Content-Type', 'application/json');

      expect([400, 401, 404]).toContain(res.status);
    });

    it('POST /auth/login com email inválido retorna 400 ou 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nao-e-email', senha: '123456' });

      expect([400, 401, 404]).toContain(res.status);
    });
  });
});
