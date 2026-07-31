import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class ReplyTicketDto {
  @IsString()
  @Length(1, 5000)
  message!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  attachments?: string[];

  /** Solo tiene efecto para agentes/admin — `admin-support.controller.ts` la respeta, `support.controller.ts` (cliente) siempre fuerza `false`. */
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
