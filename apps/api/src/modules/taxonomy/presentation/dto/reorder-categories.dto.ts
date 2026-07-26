import { ArrayNotEmpty, IsArray, IsUUID, ValidateIf } from 'class-validator';

export class ReorderCategoriesDto {
  @ValidateIf((dto: ReorderCategoriesDto) => dto.parentId !== null)
  @IsUUID()
  parentId!: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  orderedIds!: string[];
}
