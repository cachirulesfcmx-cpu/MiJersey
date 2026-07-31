export enum TicketCategory {
  GENERAL = 'GENERAL',
  ORDER_ISSUE = 'ORDER_ISSUE',
  RETURN_REFUND = 'RETURN_REFUND',
  SHIPPING = 'SHIPPING',
  PRODUCT = 'PRODUCT',
  BILLING = 'BILLING',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketMessageAuthorType {
  CUSTOMER = 'CUSTOMER',
  AGENT = 'AGENT',
  SYSTEM = 'SYSTEM',
}

export enum RmaStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}
