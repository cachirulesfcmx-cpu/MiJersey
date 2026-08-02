import { IsEmail, IsObject, IsOptional } from 'class-validator';

export class TestSendEmailTemplateDto {
  @IsEmail()
  to!: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}
