import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import type {
  CarrierProviderPort,
  CreateShipmentResult,
} from '../../domain/ports/carrier-provider.port';

/**
 * Reparto autogestionado: la tienda calcula sus propias tarifas (`ShippingRate`, motor
 * zona+peso) y genera su propio número de guía, sin depender de la API de un transportista
 * externo — un modelo real y común (mensajería propia o contratada sin integración API), no un
 * simulador. No genera PDF de etiqueta (`labelUrl: null`); imprimir/generar la guía física queda
 * fuera de alcance sin un transportista real que la emita. FedEx/DHL/Estafeta/Correos de México
 * quedan "preparados para integración" (spec §2) como adaptadores futuros de esta misma interfaz.
 */
@Injectable()
export class ManualCarrierProvider implements CarrierProviderPort {
  readonly name = 'MANUAL';

  async createShipment(_input: {
    orderId: string;
    carrierId: string;
  }): Promise<CreateShipmentResult> {
    return Promise.resolve({
      trackingNumber: `MJ-${randomUUID().slice(0, 8).toUpperCase()}`,
      labelUrl: null,
    });
  }
}
