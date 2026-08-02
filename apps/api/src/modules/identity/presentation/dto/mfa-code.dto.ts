import { IsString, Length } from 'class-validator';

/** Código TOTP de 6 dígitos — se valida como string (no number) porque puede empezar con "0". */
export class MfaCodeDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}
