import type { PaymentTransactionStatus } from '../value-objects/payment-status';

export interface PaymentProps {
  id: string;
  orderId: string;
  provider: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  authorizedAt: Date | null;
  capturedAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** "No incluye almacenamiento de datos sensibles de tarjetas" (spec §2) — no hay ningún campo de tarjeta aquí; `transactionId` es la referencia opaca del proveedor. */
export class PaymentEntity {
  constructor(private readonly props: PaymentProps) {}

  get id(): string {
    return this.props.id;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get provider(): string {
    return this.props.provider;
  }

  get transactionId(): string {
    return this.props.transactionId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get status(): PaymentTransactionStatus {
    return this.props.status;
  }

  toJSON(): PaymentProps {
    return { ...this.props };
  }
}
