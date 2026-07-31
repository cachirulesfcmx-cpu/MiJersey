export interface Carrier {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCarrierInput {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateCarrierInput {
  name?: string;
  isActive?: boolean;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  states: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateZoneInput {
  name: string;
  countries: string[];
  states?: string[];
}

export interface UpdateZoneInput {
  name?: string;
  countries?: string[];
  states?: string[];
}

export interface ShippingRate {
  id: string;
  carrierId: string;
  zoneId: string;
  name: string;
  basePrice: number;
  pricePerKg: number;
  freeShippingThreshold: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRateInput {
  carrierId: string;
  zoneId: string;
  name: string;
  basePrice: number;
  pricePerKg?: number;
  freeShippingThreshold?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive?: boolean;
}

export interface UpdateRateInput {
  name?: string;
  basePrice?: number;
  pricePerKg?: number;
  freeShippingThreshold?: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  isActive?: boolean;
}

/** Item de `GET /shipping/methods` — una tarifa configurada con el nombre de su transportista, sin destino todavía (el cálculo real por destino/peso es `ShippingQuote`). */
export type ShippingMethodListing = ShippingRate & { carrierName: string | null };

export interface CalculateRatesInput {
  country: string;
  state?: string;
}

export interface ShippingQuote {
  rateId: string;
  carrierId: string;
  carrierName: string;
  name: string;
  price: number;
  currency: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export type ShipmentStatus = 'LABEL_CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED';

export interface Shipment {
  id: string;
  orderId: string;
  carrierId: string;
  service: string;
  trackingNumber: string | null;
  labelUrl: string | null;
  status: ShipmentStatus;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface CreateShipmentInput {
  orderId: string;
  carrierId: string;
  service: string;
}

export interface UpdateShipmentStatusInput {
  status: ShipmentStatus;
  note?: string;
}
