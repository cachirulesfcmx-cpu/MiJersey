import { IsInt, IsObject, IsString, Length, Min } from 'class-validator';

export class PageBlockDto {
  @IsString()
  @Length(1, 50)
  type!: string;

  @IsInt()
  @Min(0)
  position!: number;

  @IsObject()
  config!: Record<string, unknown>;
}
