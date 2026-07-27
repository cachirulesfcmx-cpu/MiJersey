import { IsString, Length } from 'class-validator';

export class AttributeValueDto {
  @IsString()
  @Length(1, 64)
  value!: string;

  @IsString()
  @Length(1, 120)
  label!: string;
}
