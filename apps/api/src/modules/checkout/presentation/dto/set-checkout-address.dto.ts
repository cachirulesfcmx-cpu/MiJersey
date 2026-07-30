import { Type } from 'class-transformer';
import { IsEmail, IsOptional, ValidateNested } from 'class-validator';

import { CheckoutAddressDto } from './checkout-address.dto';

export class SetCheckoutAddressDto {
  @IsEmail()
  contactEmail!: string;

  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  shipping!: CheckoutAddressDto;

  /** Si se omite, se factura a la misma dirección de envío. */
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  billing?: CheckoutAddressDto;
}
