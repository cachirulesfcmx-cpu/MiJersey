import { IsOptional, IsString, Length } from 'class-validator';

export class CheckoutAddressDto {
  @IsString()
  @Length(1, 150)
  firstName!: string;

  @IsString()
  @Length(1, 150)
  lastName!: string;

  @IsOptional()
  @IsString()
  @Length(1, 150)
  company?: string;

  @IsString()
  @Length(1, 255)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  addressLine2?: string;

  @IsString()
  @Length(1, 120)
  city!: string;

  @IsString()
  @Length(1, 120)
  state!: string;

  @IsString()
  @Length(1, 20)
  postalCode!: string;

  @IsString()
  @Length(2, 2)
  country!: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  phone?: string;
}
