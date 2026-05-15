import { registerAs } from '@nestjs/config';

export default registerAs('test', () => ({
  database: {
    url: 'postgresql://test:test@localhost:5432/test_db?schema=public',
  },
  jwt: {
    secret: 'test-secret',
    expiresIn: '1h',
  },
})); 