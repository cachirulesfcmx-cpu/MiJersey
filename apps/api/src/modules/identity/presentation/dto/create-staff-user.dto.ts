import { IsEmail, IsIn, IsString, Length } from 'class-validator';

import { RoleName, STAFF_ROLES } from '../../domain/value-objects/role-name';

export class CreateStaffUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @Length(1, 100)
  lastName!: string;

  @IsIn(STAFF_ROLES)
  role!: RoleName;
}
