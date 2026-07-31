import { ArrayNotEmpty, IsArray, IsOptional, IsString, Length } from 'class-validator';

export class UpdateZoneDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  countries?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  states?: string[];
}
