export type PaymentTransactionStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  authorizedAt: string | null;
  capturedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorizePaymentInput {
  orderId: string;
  provider?: string;
}

export interface RefundPaymentInput {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface PaymentSummary {
  id: string;
  orderId: string;
  provider: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  refundedAt: string | null;
  createdAt: string;
}
