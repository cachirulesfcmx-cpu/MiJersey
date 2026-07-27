import { IsString, Length } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @Length(1, 32)
  code!: string;

  @IsString()
  @Length(1, 150)
  name!: string;
}
