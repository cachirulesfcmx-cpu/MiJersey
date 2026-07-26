import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';
import type { AccessTokenPayload } from '../../domain/ports/token.service.port';
import { PERMISSION_REPOSITORY } from '../../identity.constants';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepositoryPort,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AccessTokenPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No autenticado');
    }

    const grantedKeys = await this.permissions.getPermissionKeysForRole(user.role);
    const grantedSet = new Set(grantedKeys);
    const hasAll = required.every((permission) => grantedSet.has(permission));

    if (!hasAll) {
      throw new ForbiddenException('No tienes permisos suficientes');
    }

    return true;
  }
}
