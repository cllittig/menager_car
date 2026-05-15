import 'express-serve-static-core';
import type { AuthenticatedUser } from './authenticated-user';

declare module 'express-serve-static-core' {
  interface Request {

    realIp?: string;
    user?: AuthenticatedUser;
  }
}
