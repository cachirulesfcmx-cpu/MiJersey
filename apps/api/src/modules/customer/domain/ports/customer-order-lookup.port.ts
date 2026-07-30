import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

/** Lectura propia de Customer Account sobre las tablas físicas `orders`/`order_items` (018-Checkout) — mismo patrón CQRS de solo lectura del resto de la sesión, en vez de importar `CheckoutModule` (Order pertenece de forma definitiva a 021-Orders, que todavía no existe; Checkout solo lo aloja mientras tanto). */
export interface CustomerOrderItemView {
  id: string;
  productId: string;
  variantId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CustomerOrderSummaryView {
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

export interface CustomerOrderDetailView extends CustomerOrderSummaryView {
  customerId: string | null;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  items: CustomerOrderItemView[];
}

export interface CustomerOrderLookupPort {
  findByCustomerId(
    customerId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<CustomerOrderSummaryView>>;
  findById(id: string): Promise<CustomerOrderDetailView | null>;
}
