export type { LoginDto, AuthResponse } from '@/lib/authentication';
export {
  AuthApplicationService as AuthService,
  authApplicationService as authService,
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  getAuthToken,
} from '@/lib/authentication';
