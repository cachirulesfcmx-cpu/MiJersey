import { IsString, Length, MinLength } from 'class-validator';

export class VerifyMfaChallengeDto {
  @IsString()
  @MinLength(1)
  challengeToken!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
