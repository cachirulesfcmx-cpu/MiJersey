import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdateCarrierDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
