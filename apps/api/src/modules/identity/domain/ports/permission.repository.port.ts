import type { RoleName } from '../value-objects/role-name';

export interface PermissionRepositoryPort {
  getPermissionKeysForRole(role: RoleName): Promise<string[]>;
}
