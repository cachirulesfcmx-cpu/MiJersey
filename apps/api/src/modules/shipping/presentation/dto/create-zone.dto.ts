import { ArrayNotEmpty, IsArray, IsOptional, IsString, Length } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  @Length(1, 150)
  name!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  countries!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  states?: string[];
}
