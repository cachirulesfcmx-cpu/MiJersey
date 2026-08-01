import { IsDateString, IsOptional } from 'class-validator';

export class PublishPageDto {
  @IsOptional()
  @IsDateString()
  publishAt?: string;
}
