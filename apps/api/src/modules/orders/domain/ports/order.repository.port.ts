import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { OrderEntity } from '../entities/order.entity';

export interface OrderSummaryView {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currency: string;
  grandTotal: number;
  itemCount: number;
  createdAt: Date;
}

export interface ListAllOrdersParams extends PaginationParams {
  status?: string;
}

export interface OrderRepositoryPort {
  findById(id: string): Promise<OrderEntity | null>;
  findByCustomerId(
    customerId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<OrderSummaryView>>;
  /** Para el Orders Dashboard de administración — sin filtro de propietario. */
  findAll(params: ListAllOrdersParams): Promise<PaginatedResult<OrderSummaryView>>;
  cancel(id: string, reason: string | null): Promise<OrderEntity>;
  /** Reservado para 022-Payments/023-Shipping: actualizar `paymentStatus`/`fulfillmentStatus` sin pasar por `cancel()`. No tiene consumidores todavía dentro de 021. */
  updateField(
    id: string,
    field: 'paymentStatus' | 'fulfillmentStatus',
    value: string,
  ): Promise<OrderEntity>;
}
