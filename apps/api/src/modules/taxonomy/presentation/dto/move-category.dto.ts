import { IsUUID, ValidateIf } from 'class-validator';

export class MoveCategoryDto {
  @ValidateIf((dto: MoveCategoryDto) => dto.parentId !== null)
  @IsUUID()
  parentId!: string | null;
}
