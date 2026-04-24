import './load-env';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import type { Request, RequestHandler, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar compressão avançada (Brotli + Gzip)
  const compressionMiddleware = compression as (
    options?: compression.CompressionOptions,
  ) => RequestHandler;

  app.use(
    compressionMiddleware({
      brotli: {
        enabled: true,
        zlib: {},
      },
      level: 6,
      threshold: 1024,
      filter: (req: Request, res: Response): boolean => {
        if (req.headers['x-no-compression']) {
          return false;
        }

        const contentType = res.getHeader('content-type');
        const ct = typeof contentType === 'string' ? contentType : undefined;
        if (ct) {
          return /text|json|javascript|css|xml|svg/.test(ct);
        }

        return true;
      },
    }),
  );
  
  // Configurar headers de segurança com Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Para compatibilidade com Swagger
  }));
  
  // Configurar pipes globais
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, 
      whitelist: true,
      forbidNonWhitelisted: true, // Rejeita propriedades não permitidas
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configurar filtros globais
  app.useGlobalFilters(new GlobalExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('ManagerCar API')
    .setDescription('API ManagerCar — gestão de veículos, vendas e operações')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('vehicles')
    .addTag('users')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  // Configurar CORS seguro
  const isProduction = process.env.NODE_ENV === 'production';
  const devFrontendOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(process.env.DEV_FRONTEND_ORIGINS?.split(',')
      .map((o) => o.trim())
      .filter(Boolean) ?? []),
  ];

  function isDevLanFrontendOrigin(origin: string): boolean {
    try {
      const u = new URL(origin);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        return false;
      }
      const port = u.port || (u.protocol === 'https:' ? '443' : '80');
      if (port !== '3000') {
        return false;
      }
      const h = u.hostname;
      if (h === 'localhost' || h === '127.0.0.1') {
        return true;
      }
      if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) {
        return true;
      }
      if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) {
        return true;
      }
      return /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(h);
    } catch {
      return false;
    }
  }

  app.enableCors({
    origin: isProduction
      ? process.env.FRONTEND_URL?.split(',') || ['https://seudominio.com']
      : (origin, callback) => {
          if (!origin) {
            callback(null, true);
            return;
          }
          if (devFrontendOrigins.includes(origin)) {
            callback(null, true);
            return;
          }
          if (isDevLanFrontendOrigin(origin)) {
            callback(null, true);
            return;
          }
          callback(null, false);
        },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, // Cache preflight por 24 horas
  });

  const port = parseInt(process.env.PORT ?? '3005', 10);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
}

void bootstrap();
