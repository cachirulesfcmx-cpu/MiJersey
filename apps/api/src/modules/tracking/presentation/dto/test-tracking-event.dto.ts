import { IsObject, IsOptional, IsString } from 'class-validator';

export class TestTrackingEventDto {
  @IsString()
  providerId!: string;

  @IsString()
  eventName!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
