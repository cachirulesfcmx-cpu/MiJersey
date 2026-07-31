import { FulfillmentStatus, OrderStatus } from './order-enums';

/** Regla de negocio de cancelación (spec §4/§9 "validación de estados"): no se puede cancelar un pedido ya cerrado (cancelado/reembolsado) ni uno cuyo envío ya salió — a partir de `SHIPPED` la cancelación deja de tener sentido operativo (correspondería a una devolución, "preparada para integración" pero no implementada aquí). */
export function canCancelOrder(order: {
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
}): boolean {
  if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
    return false;
  }
  if (
    order.fulfillmentStatus === FulfillmentStatus.SHIPPED ||
    order.fulfillmentStatus === FulfillmentStatus.DELIVERED
  ) {
    return false;
  }
  return true;
}
