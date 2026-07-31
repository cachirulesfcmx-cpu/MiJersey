import type { RmaStatus } from '../value-objects/support-enums';

export interface RmaRequestProps {
  id: string;
  rmaNumber: string;
  ticketId: string | null;
  orderId: string;
  customerId: string;
  reason: string;
  itemsDescription: string;
  status: RmaStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class RmaRequestEntity {
  constructor(private readonly props: RmaRequestProps) {}

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get status(): RmaStatus {
    return this.props.status;
  }

  toJSON(): RmaRequestProps {
    return { ...this.props };
  }
}
