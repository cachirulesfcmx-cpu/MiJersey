import type { ShippingRateEntity } from '../entities/shipping-rate.entity';

export interface CreateRateData {
  carrierId: string;
  zoneId: string;
  name: string;
  basePrice: number;
  pricePerKg?: number;
  freeShippingThreshold?: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive?: boolean;
}

export interface UpdateRateData {
  name?: string;
  basePrice?: number;
  pricePerKg?: number;
  freeShippingThreshold?: number | null;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  isActive?: boolean;
}

export interface ShippingRateRepositoryPort {
  findById(id: string): Promise<ShippingRateEntity | null>;
  findMany(): Promise<ShippingRateEntity[]>;
  /** Volumen esperado bajo (pocas zonas/transportistas por tienda) — se filtra por zona coincidente en memoria dentro del caso de uso, igual que `ListShippingMethodsUseCase` (018) filtra activos en memoria. */
  findActive(): Promise<ShippingRateEntity[]>;
  create(data: CreateRateData): Promise<ShippingRateEntity>;
  update(id: string, data: UpdateRateData): Promise<ShippingRateEntity>;
  delete(id: string): Promise<void>;
}
