import { IsUUID } from 'class-validator';

export class RecordUsageDto {
  @IsUUID()
  orderId!: string;
}
