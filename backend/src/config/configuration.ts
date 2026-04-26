export default () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    database: {
        url: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'sua-chave-secreta',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    security: {
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
            max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        },
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        maxFiles: process.env.LOG_MAX_FILES || '14d',
        maxSize: process.env.LOG_MAX_SIZE || '20m',
    },
    backup: {
        enabled: process.env.BACKUP_ENABLED === 'true',
        schedule: process.env.BACKUP_SCHEDULE || '0 0 * * *',
        retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
        path: process.env.BACKUP_PATH || '/backups',
    },
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
}); 