import { registerAs } from '@nestjs/config';

export default registerAs('production', () => ({

  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      throw new Error('JWT_SECRET is required in production');
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h', 
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },


  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10), 
    sessionSecret: process.env.SESSION_SECRET || (() => {
      throw new Error('SESSION_SECRET is required in production');
    })(),
    cookieSettings: {
      httpOnly: true,
      secure: true, 
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    },
  },


  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), 
    max: parseInt(process.env.RATE_LIMIT_MAX || '50', 10), 
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
  },


  logging: {
    level: process.env.LOG_LEVEL || 'warn', 
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
        enabled: false, 
      },
    },
  },


  cors: {
    origin: process.env.FRONTEND_URLS?.split(',') || [],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, 
  },


  monitoring: {
    enabled: true,
    metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000', 10), 
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000', 10), 
    errorThreshold: parseInt(process.env.ERROR_THRESHOLD || '10', 10), 
    slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000', 10), 
  },


  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', 
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    compression: true,
    encryption: {
      enabled: process.env.BACKUP_ENCRYPTION === 'true',
      key: process.env.BACKUP_ENCRYPTION_KEY,
    },
  },


  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10), 
    max: parseInt(process.env.CACHE_MAX || '1000', 10),
    store: process.env.CACHE_STORE || 'memory',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
  },


  performance: {
    compression: {
      enabled: true,
      level: 6,
      threshold: 1024, 
    },
    bodyParser: {
      limit: '1mb', 
      jsonLimit: '1mb',
      urlencoded: {
        limit: '1mb',
        extended: true,
      },
    },
  },


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


  ssl: {
    enforceHttps: true,
    hsts: {
      maxAge: 31536000, 
      includeSubDomains: true,
      preload: true,
    },
  },
})); 