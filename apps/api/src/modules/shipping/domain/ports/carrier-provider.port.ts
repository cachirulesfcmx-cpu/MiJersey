export interface CreateShipmentResult {
  trackingNumber: string;
  labelUrl: string | null;
}

/** Punto de extensión para transportistas con API real (FedEx/DHL/Estafeta/Correos de México) — "preparado para integración" (spec §2 "Generación de guías"). `ManualCarrierProvider` es hoy el único adaptador concreto. */
export interface CarrierProviderPort {
  readonly name: string;
  createShipment(input: { orderId: string; carrierId: string }): Promise<CreateShipmentResult>;
}
