import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { SearchResultType } from '../../domain/value-objects/search-enums';

export class LogSearchClickDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  term!: string;

  @IsEnum(SearchResultType)
  entityType!: SearchResultType;

  @IsUUID()
  entityId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;
}
