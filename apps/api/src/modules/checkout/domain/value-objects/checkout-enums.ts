export enum CheckoutStatus {
  STARTED = 'STARTED',
  CONFIRMED = 'CONFIRMED',
  ABANDONED = 'ABANDONED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum FulfillmentStatus {
  UNFULFILLED = 'UNFULFILLED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
}
