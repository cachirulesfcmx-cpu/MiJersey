import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class UploadMediaDto {
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  altText?: string;

  /** Etiquetas separadas por comas (form-data no admite arrays tipados de forma nativa). */
  @IsOptional()
  @IsString()
  tags?: string;
}
