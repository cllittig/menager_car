/**
 * Converte mensagens de violação de unicidade (Postgres / PostgREST) em texto para o utilizador.
 */
export function friendlyPostgresUniqueMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes('user_email') ||
    lower.includes('email_key') ||
    (lower.includes('duplicate') && lower.includes('email'))
  ) {
    return 'Este e-mail já está cadastrado. Faça login ou use outro endereço de e-mail.';
  }
  if (lower.includes('slug') && lower.includes('tenant')) {
    return 'Não foi possível criar a empresa: este nome já gerou um identificador em uso. Tente um nome ligeiramente diferente.';
  }
  return 'Estes dados já existem no sistema. Verifique as informações e tente novamente.';
}
