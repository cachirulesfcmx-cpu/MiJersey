import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class CreateRedirectDto {
  @IsString()
  @Length(1, 500)
  fromPath!: string;

  @IsString()
  @Length(1, 500)
  toPath!: string;

  @IsOptional()
  @IsIn([301, 302])
  statusCode?: number;
}
