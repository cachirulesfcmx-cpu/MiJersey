import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateCarrierDto {
  @IsString()
  @Length(1, 150)
  name!: string;

  @IsString()
  @Length(1, 30)
  code!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
