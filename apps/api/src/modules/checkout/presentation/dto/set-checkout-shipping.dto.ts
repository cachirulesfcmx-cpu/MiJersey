import { IsUUID } from 'class-validator';

export class SetCheckoutShippingDto {
  @IsUUID()
  shippingMethodId!: string;
}
