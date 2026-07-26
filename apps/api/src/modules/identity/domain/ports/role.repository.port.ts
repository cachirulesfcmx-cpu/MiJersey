import type { RoleName } from '../value-objects/role-name';

export interface RoleSummary {
  name: RoleName;
  description: string | null;
  permissions: string[];
}

export interface RoleRepositoryPort {
  listRoles(): Promise<RoleSummary[]>;
}
