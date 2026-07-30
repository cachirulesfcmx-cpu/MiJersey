import { IsBoolean } from 'class-validator';

export class PreferencesDto {
  @IsBoolean()
  marketingEmailsOptIn!: boolean;
}
