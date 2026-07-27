import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @Length(1, 150)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 150)
  slug?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
