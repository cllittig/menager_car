import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'sua-chave-secreta',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  swagger: {
    title: 'Controle de Estoque Veicular API',
    description: 'API para controle de estoque veicular',
    version: '1.0',
    path: 'api/docs',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
})); 