import { IsString, Length } from 'class-validator';

export class ResolveRedirectQueryDto {
  @IsString()
  @Length(1, 500)
  path!: string;
}
