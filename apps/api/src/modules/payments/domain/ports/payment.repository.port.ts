import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { PaymentEntity } from '../entities/payment.entity';
import type { PaymentTransactionStatus } from '../value-objects/payment-status';

export interface CreatePaymentData {
  orderId: string;
  provider: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
}

export interface UpdatePaymentStatusData {
  status: PaymentTransactionStatus;
  authorizedAt?: Date | null;
  capturedAt?: Date | null;
  refundedAt?: Date | null;
}

export interface PaymentSummaryView {
  id: string;
  orderId: string;
  provider: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  refundedAt: Date | null;
  createdAt: Date;
}

export interface PaymentRepositoryPort {
  findById(id: string): Promise<PaymentEntity | null>;
  findByOrderId(orderId: string): Promise<PaymentEntity[]>;
  findByProviderTransactionId(
    provider: string,
    transactionId: string,
  ): Promise<PaymentEntity | null>;
  create(data: CreatePaymentData): Promise<PaymentEntity>;
  updateStatus(id: string, patch: UpdatePaymentStatusData): Promise<PaymentEntity>;
  /** Refund History (admin) — pagos con estado `REFUNDED`/`PARTIALLY_REFUNDED`. */
  findRefunded(params: PaginationParams): Promise<PaginatedResult<PaymentSummaryView>>;
}
