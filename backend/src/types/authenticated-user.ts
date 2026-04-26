/**
 * Dados anexados a `req.user` após validação JWT (Passport ou AuthGuard legado).
 */
export interface AuthenticatedUser {
  id: string;
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  name?: string;
  iat?: number;
  exp?: number;
}
