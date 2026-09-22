import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthUser } from './auth-user';
import { PERMISSIONS_KEY } from './permissions.decorator';

/**
 * Reads the Auth0 RBAC `permissions` claim JwtStrategy leaves on `req.user`
 * and requires every permission listed by @Permissions(...) on the handler
 * or controller. Must run after JwtAuthGuard, which is what populates
 * `req.user` in the first place — see issue #49.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!required || required.length === 0) {
      return true;
    }

    const user: AuthUser = context.switchToHttp().getRequest().user;
    const granted = user?.permissions ?? [];
    const hasAll = required.every((permission) => granted.includes(permission));
    if (!hasAll) {
      throw new ForbiddenException('Missing required permission');
    }
    return true;
  }
}
