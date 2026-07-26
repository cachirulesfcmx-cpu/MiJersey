import { IsIn } from 'class-validator';

import { RoleName, STAFF_ROLES } from '../../domain/value-objects/role-name';

export class UpdateUserRoleDto {
  @IsIn(STAFF_ROLES)
  role!: RoleName;
}
