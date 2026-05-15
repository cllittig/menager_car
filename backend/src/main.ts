import './load-env';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import type { Request, RequestHandler, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { parseCorsOrigins, parseCsv } from './config/env-utils';

function originsLookOnlyLocalhost(origins: string[]): boolean {
  if (origins.length === 0) {
    return false;
  }
  return origins.every((o) => {
    try {
      const h = new URL(o).hostname;
      return h === 'localhost' || h === '127.0.0.1';
    } catch {
      return false;
    }
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


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


  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, 
  }));


  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, 
      whitelist: true,
      forbidNonWhitelisted: true, 
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );


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


  const isProduction = process.env.NODE_ENV === 'production';
  const explicitCorsOrigins = parseCorsOrigins(
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
  );
  const productionCorsOriginsRaw = explicitCorsOrigins;
  const productionCorsOrigins =
    productionCorsOriginsRaw.length > 0
      ? productionCorsOriginsRaw
      : ['https://seudominio.com'];

  const devFrontendOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...explicitCorsOrigins,
    ...parseCsv(process.env.DEV_FRONTEND_ORIGINS),
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

  type CorsOriginCallback = (err: Error | null, allow: boolean) => void;
  const devCorsOriginDelegate = (
    origin: string | undefined,
    callback: CorsOriginCallback,
  ): void => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const normalizedOrigin = origin.trim().replace(/\/$/, '').toLowerCase();
    
    const isAllowed = devFrontendOrigins.some(o => o.toLowerCase().replace(/\/$/, '') === normalizedOrigin) ||
                     isDevLanFrontendOrigin(origin);
                     
    callback(null, isAllowed);
  };

  app.enableCors({
    origin: isProduction
      ? productionCorsOrigins
      : devCorsOriginDelegate,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400, 
  });

  const port = parseInt(process.env.PORT ?? '3005', 10);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);

  const logger = new Logger('Bootstrap');
  logger.log(`HTTP API em ${host}:${port}`);
  if (host === '0.0.0.0') {
    logger.log(
      'Bind em todas as interfaces; alcance WAN depende de firewall e encaminhamento de portas no roteador.',
    );
  }
  if (isProduction) {
    logger.log(`CORS (origens permitidas): ${productionCorsOrigins.join(', ')}`);
    if (productionCorsOriginsRaw.length === 0) {
      logger.warn(
        'FRONTEND_URL não definido; usando fallback de CORS. Defina FRONTEND_URL com a URL exata do Next (ex.: http://IP_FIXO:3000).',
      );
    } else if (originsLookOnlyLocalhost(productionCorsOrigins)) {
      logger.warn(
        'FRONTEND_URL é só localhost; clientes que abrirem o site pelo IP público terão Origin diferente e o browser pode bloquear a API (CORS). Inclua também http://SEU_IP:3000 (ou domínio) em FRONTEND_URL.',
      );
    }
  }
}

void bootstrap();
