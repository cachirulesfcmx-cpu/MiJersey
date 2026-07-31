import type { ShippingZoneEntity } from '../entities/shipping-zone.entity';

export interface CreateZoneData {
  name: string;
  countries: string[];
  states?: string[];
}

export interface UpdateZoneData {
  name?: string;
  countries?: string[];
  states?: string[];
}

export interface ShippingZoneRepositoryPort {
  findById(id: string): Promise<ShippingZoneEntity | null>;
  findMany(): Promise<ShippingZoneEntity[]>;
  create(data: CreateZoneData): Promise<ShippingZoneEntity>;
  update(id: string, data: UpdateZoneData): Promise<ShippingZoneEntity>;
  delete(id: string): Promise<void>;
}
