import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AssignAttributeDto {
  @IsUUID()
  attributeId!: string;

  @IsOptional()
  @IsUUID()
  valueId?: string;

  @IsOptional()
  @IsString()
  customValue?: string;
}
