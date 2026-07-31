import { isFirstResponseBreached, isResolutionBreached } from '../value-objects/sla.util';
import type { TicketCategory, TicketPriority, TicketStatus } from '../value-objects/support-enums';

export interface TicketProps {
  id: string;
  ticketNumber: string;
  customerId: string;
  orderId: string | null;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAgentId: string | null;
  firstResponseDueAt: Date;
  resolutionDueAt: Date;
  firstRespondedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TicketEntity {
  constructor(private readonly props: TicketProps) {}

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get orderId(): string | null {
    return this.props.orderId;
  }

  get status(): TicketStatus {
    return this.props.status;
  }

  get priority(): TicketPriority {
    return this.props.priority;
  }

  get firstRespondedAt(): Date | null {
    return this.props.firstRespondedAt;
  }

  get firstResponseDueAt(): Date {
    return this.props.firstResponseDueAt;
  }

  get resolutionDueAt(): Date {
    return this.props.resolutionDueAt;
  }

  toJSON(now: Date = new Date()): TicketProps & {
    firstResponseBreached: boolean;
    resolutionBreached: boolean;
  } {
    return {
      ...this.props,
      firstResponseBreached: isFirstResponseBreached(this.props, now),
      resolutionBreached: isResolutionBreached(this.props, now),
    };
  }
}
