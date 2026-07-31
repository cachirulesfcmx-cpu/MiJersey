import type { TicketMessageAuthorType } from '../value-objects/support-enums';

export interface TicketMessageProps {
  id: string;
  ticketId: string;
  authorType: TicketMessageAuthorType;
  authorId: string | null;
  message: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: Date;
}

export class TicketMessageEntity {
  constructor(private readonly props: TicketMessageProps) {}

  get id(): string {
    return this.props.id;
  }

  get ticketId(): string {
    return this.props.ticketId;
  }

  get authorType(): TicketMessageAuthorType {
    return this.props.authorType;
  }

  get isInternal(): boolean {
    return this.props.isInternal;
  }

  toJSON(): TicketMessageProps {
    return { ...this.props };
  }
}
