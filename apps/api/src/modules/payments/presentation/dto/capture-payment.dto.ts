import { IsUUID } from 'class-validator';

export class CapturePaymentDto {
  @IsUUID()
  paymentId!: string;
}
