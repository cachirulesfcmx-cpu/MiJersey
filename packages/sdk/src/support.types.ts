export type TicketCategory =
  'GENERAL' | 'ORDER_ISSUE' | 'RETURN_REFUND' | 'SHIPPING' | 'PRODUCT' | 'BILLING';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';

export type TicketMessageAuthorType = 'CUSTOMER' | 'AGENT' | 'SYSTEM';

export type RmaStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerId: string;
  orderId: string | null;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAgentId: string | null;
  firstResponseDueAt: string;
  resolutionDueAt: string;
  firstRespondedAt: string | null;
  closedAt: string | null;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorType: TicketMessageAuthorType;
  authorId: string | null;
  message: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: string;
}

export interface RmaRequest {
  id: string;
  rmaNumber: string;
  ticketId: string | null;
  orderId: string;
  customerId: string;
  reason: string;
  itemsDescription: string;
  status: RmaStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInput {
  orderId?: string;
  subject: string;
  category: TicketCategory;
  priority?: TicketPriority;
}

export interface ReplyTicketInput {
  message: string;
  attachments?: string[];
  /** Solo tiene efecto en `/admin/support/tickets/:id/reply`. */
  isInternal?: boolean;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedAgentId?: string | null;
}

export interface CreateRmaInput {
  orderId: string;
  ticketId?: string;
  reason: string;
  itemsDescription: string;
}

export interface UpdateRmaStatusInput {
  status: RmaStatus;
}

export interface ListTicketsParams {
  page?: number;
  pageSize?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedAgentId?: string;
}

export interface ListRmaParams {
  page?: number;
  pageSize?: number;
  status?: RmaStatus;
}
