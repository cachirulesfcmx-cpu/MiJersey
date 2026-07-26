import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import type { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';
import type { AccessTokenPayload } from '../../domain/ports/token.service.port';
import { RoleName } from '../../domain/value-objects/role-name';
import { PermissionsGuard } from './permissions.guard';

function buildContext(user: AccessTokenPayload | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function buildGuard(
  requiredPermissions: string[] | undefined,
  grantedKeys: string[],
): PermissionsGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(requiredPermissions),
  } as unknown as jest.Mocked<Reflector>;
  const permissions: jest.Mocked<PermissionRepositoryPort> = {
    getPermissionKeysForRole: jest.fn().mockResolvedValue(grantedKeys),
  };

  return new PermissionsGuard(permissions, reflector);
}

describe('PermissionsGuard', () => {
  it('allows access when no permission is required', async () => {
    const guard = buildGuard(undefined, []);
    const context = buildContext({ sub: 'user-1', role: RoleName.CUSTOMER, sid: 'session-1' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('allows access when the role has all required permissions', async () => {
    const guard = buildGuard(['admin:access'], ['admin:access', 'identity:manage']);
    const context = buildContext({ sub: 'user-1', role: RoleName.ADMIN, sid: 'session-1' });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('denies access when the role is missing a required permission', async () => {
    const guard = buildGuard(['system:configure'], ['admin:access']);
    const context = buildContext({ sub: 'user-1', role: RoleName.ADMIN, sid: 'session-1' });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies access when there is no authenticated user', async () => {
    const guard = buildGuard(['admin:access'], []);
    const context = buildContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
