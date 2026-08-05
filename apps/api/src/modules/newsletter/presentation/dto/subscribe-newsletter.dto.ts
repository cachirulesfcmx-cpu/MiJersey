import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class SubscribeNewsletterDto {
  @IsEmail()
  @Length(1, 254)
  email!: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  source?: string;
}
