import { IsObject, IsOptional, IsString } from 'class-validator';

export class RecordAnalyticsEventDto {
  @IsString()
  eventType!: string;

  @IsString()
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
