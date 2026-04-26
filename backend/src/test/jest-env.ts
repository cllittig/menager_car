/**
 * Roda antes dos testes (setupFiles) para variáveis lidas na importação dos módulos.
 */
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test-jwt-secret-for-jest-minimum-32-chars';
