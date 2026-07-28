import { IsOptional, IsString, IsUrl, IsUUID, Length } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @Length(1, 150)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 150)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  shortDescription?: string;

  @IsOptional()
  @IsUUID()
  logoMediaId?: string;

  @IsOptional()
  @IsUUID()
  coverMediaId?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  country?: string;
}
