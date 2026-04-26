import 'express-serve-static-core';
import type { AuthenticatedUser } from './authenticated-user';

declare module 'express-serve-static-core' {
  interface Request {
    /** IP real quando definido por proxy (ex.: middleware). */
    realIp?: string;
    user?: AuthenticatedUser;
  }
}
