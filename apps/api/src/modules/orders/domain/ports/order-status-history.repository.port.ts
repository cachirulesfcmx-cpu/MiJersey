import type { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';

export interface CreateOrderStatusHistoryData {
  orderId: string;
  field: string;
  value: string;
  note?: string | null;
}

export interface OrderStatusHistoryRepositoryPort {
  findByOrderId(orderId: string): Promise<OrderStatusHistoryEntity[]>;
  create(data: CreateOrderStatusHistoryData): Promise<OrderStatusHistoryEntity>;
}
