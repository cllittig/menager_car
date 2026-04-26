/**
 * Perfis com acesso às operações de negócio (documento: Usuário e Funcionário + Admin).
 * Visitante não possui role no JWT (apenas rotas públicas).
 */
export const OPERATIONAL_ROLES = ['USER', 'EMPLOYEE', 'ADMIN'] as const;
