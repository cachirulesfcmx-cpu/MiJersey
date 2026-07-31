import { ShipmentStatus } from './shipment-status';

const TERMINAL_STATUSES = new Set<ShipmentStatus>([
  ShipmentStatus.DELIVERED,
  ShipmentStatus.RETURNED,
  ShipmentStatus.FAILED,
]);

/** Un envío en un estado terminal (entregado, devuelto o fallido) no admite más actualizaciones de seguimiento — un intento fallido no se "reintenta" actualizando el mismo registro, `CreateShipmentUseCase` genera uno nuevo (mismo criterio que `PaymentTransactionStatus.FAILED` en 022, que tampoco admite reintentos sobre el mismo `Payment`). También determina, desde `CreateShipmentUseCase`, si un pedido ya tiene un envío "activo" que bloquee generar uno nuevo. */
export function canTransitionShipment(current: ShipmentStatus): boolean {
  return !TERMINAL_STATUSES.has(current);
}
