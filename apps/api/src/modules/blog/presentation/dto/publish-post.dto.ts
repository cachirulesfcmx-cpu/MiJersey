import { IsDateString, IsOptional } from 'class-validator';

export class PublishPostDto {
  @IsOptional()
  @IsDateString()
  publishAt?: string;
}
