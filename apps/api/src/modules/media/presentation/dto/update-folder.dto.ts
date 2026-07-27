import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 150)
  slug?: string;
}
