import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

/** Contexto mínimo para evaluar `visibilityRules` (spec §2/§4 "visibilidad por contexto") en una lectura pública sin sesión obligatoria. */
export class RenderMenuQueryDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  authenticated?: boolean;

  @IsOptional()
  @IsString()
  device?: string;
}
