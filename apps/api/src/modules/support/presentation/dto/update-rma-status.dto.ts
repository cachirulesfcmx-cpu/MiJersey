import { IsEnum } from 'class-validator';

import { RmaStatus } from '../../domain/value-objects/support-enums';

export class UpdateRmaStatusDto {
  @IsEnum(RmaStatus)
  status!: RmaStatus;
}
