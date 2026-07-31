import { IsIn, IsOptional, IsUUID } from 'class-validator';

import { MANUAL_PROVIDER } from '../../payments.constants';

const SUPPORTED_PROVIDERS = [MANUAL_PROVIDER] as const;

export class AuthorizePaymentDto {
  @IsUUID()
  orderId!: string;

  @IsOptional()
  @IsIn(SUPPORTED_PROVIDERS)
  provider: string = MANUAL_PROVIDER;
}
