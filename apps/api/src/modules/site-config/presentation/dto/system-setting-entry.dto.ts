import { IsNotEmpty, IsString, Length } from 'class-validator';

export class SystemSettingEntryDto {
  @IsString()
  @Length(1, 150)
  key!: string;

  @IsNotEmpty()
  value!: unknown;

  @IsString()
  @Length(1, 60)
  category!: string;
}
