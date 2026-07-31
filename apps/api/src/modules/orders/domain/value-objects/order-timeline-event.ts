/** Evento de la línea de tiempo (spec §2/§6 "Order Timeline"). El primer evento ("Confirmado") no proviene de `OrderStatusHistory` — se deriva de `Order.createdAt` al construir la vista, ver `GetOrderTimelineUseCase`. */
export interface OrderTimelineEvent {
  field: string;
  value: string;
  note: string | null;
  occurredAt: Date;
}
