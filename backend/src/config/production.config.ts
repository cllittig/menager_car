import { registerAs } from '@nestjs/config';

export default registerAs('production', () => ({
  // Configurações de JWT mais seguras para produção
  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      throw new Error('JWT_SECRET is required in production');
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h', // Token mais curto em produção
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Configurações de segurança
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10), // Mais rounds em produção
    sessionSecret: process.env.SESSION_SECRET || (() => {
      throw new Error('SESSION_SECRET is required in production');
    })(),
    cookieSettings: {
      httpOnly: true,
      secure: true, // HTTPS obrigatório
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    },
  },

  // Rate limiting mais restritivo
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX || '50', 10), // 50 requests por 15 min
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Configurações de logging
  logging: {
    level: process.env.LOG_LEVEL || 'warn', // Menos verboso em produção
    format: 'json',
    transports: {
      file: {
        enabled: true,
        level: 'error',
        filename: 'logs/error.log',
        maxSize: '20m',
        maxFiles: '14d',
      },
      console: {
        enabled: false, // Desabilita logs no console em produção
      },
    },
  },

  // Configurações de CORS mais restritivas
  cors: {
    origin: process.env.FRONTEND_URLS?.split(',') || [],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 horas
  },

  // Configurações de monitoring
  monitoring: {
    enabled: true,
    metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000', 10), // 1 minuto
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10), // 30 segundos
    errorThreshold: parseInt(process.env.ERROR_THRESHOLD || '10', 10), // 10 erros por minuto
    slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000', 10), // 1 segundo
  },

  // Configurações de backup
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Todo dia às 2h
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    compression: true,
    encryption: {
      enabled: process.env.BACKUP_ENCRYPTION === 'true',
      key: process.env.BACKUP_ENCRYPTION_KEY,
    },
  },

  // Configurações de cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutos
    max: parseInt(process.env.CACHE_MAX || '1000', 10),
    store: process.env.CACHE_STORE || 'memory',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
  },

  // Configurações de performance
  performance: {
    compression: {
      enabled: true,
      level: 6,
      threshold: 1024, // Comprimir responses > 1KB
    },
    bodyParser: {
      limit: '1mb', // Limite de upload
      jsonLimit: '1mb',
      urlencoded: {
        limit: '1mb',
        extended: true,
      },
    },
  },

  // Notificações de segurança
  notifications: {
    security: {
      enabled: process.env.SECURITY_NOTIFICATIONS === 'true',
      email: {
        to: process.env.SECURITY_EMAIL || 'admin@seudominio.com',
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
      },
      webhook: {
        url: process.env.SECURITY_WEBHOOK_URL,
        token: process.env.SECURITY_WEBHOOK_TOKEN,
      },
    },
  },

  // Configurações de SSL/TLS
  ssl: {
    enforceHttps: true,
    hsts: {
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true,
    },
  },
})); 