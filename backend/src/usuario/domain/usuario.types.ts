/** Resposta parcial de usuário para listagens administrativas (sem senha). */
export interface UsuarioListRow {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  isActive: boolean;
}

export interface UsuarioCreateSuccess {
  code: number;
  message: string;
}

export interface UsuarioMutationError {
  statusCode: number;
  message: string;
  error?: string;
}
