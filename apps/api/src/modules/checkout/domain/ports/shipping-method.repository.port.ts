import type { ShippingMethodEntity } from '../entities/shipping-method.entity';

export interface CreateShippingMethodData {
  name: string;
  description?: string | null;
  basePrice: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive?: boolean;
}

export interface UpdateShippingMethodData {
  name?: string;
  description?: string | null;
  basePrice?: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  isActive?: boolean;
}

export interface ShippingMethodRepositoryPort {
  findById(id: string): Promise<ShippingMethodEntity | null>;
  findActive(): Promise<ShippingMethodEntity[]>;
  findMany(): Promise<ShippingMethodEntity[]>;
  create(data: CreateShippingMethodData): Promise<ShippingMethodEntity>;
  update(id: string, data: UpdateShippingMethodData): Promise<ShippingMethodEntity>;
  delete(id: string): Promise<void>;
}
