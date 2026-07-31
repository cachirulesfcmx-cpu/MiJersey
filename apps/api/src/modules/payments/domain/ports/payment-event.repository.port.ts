import type { PaymentEventEntity } from '../entities/payment-event.entity';

export interface CreatePaymentEventData {
  paymentId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface PaymentEventRepositoryPort {
  findByPaymentId(paymentId: string): Promise<PaymentEventEntity[]>;
  create(data: CreatePaymentEventData): Promise<PaymentEventEntity>;
}
