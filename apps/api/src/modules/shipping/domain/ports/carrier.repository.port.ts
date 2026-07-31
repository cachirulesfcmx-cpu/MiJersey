import type { CarrierEntity } from '../entities/carrier.entity';

export interface CreateCarrierData {
  name: string;
  code: string;
  isActive?: boolean;
}

export interface UpdateCarrierData {
  name?: string;
  isActive?: boolean;
}

export interface CarrierRepositoryPort {
  findById(id: string): Promise<CarrierEntity | null>;
  findByCode(code: string): Promise<CarrierEntity | null>;
  findActive(): Promise<CarrierEntity[]>;
  findMany(): Promise<CarrierEntity[]>;
  create(data: CreateCarrierData): Promise<CarrierEntity>;
  update(id: string, data: UpdateCarrierData): Promise<CarrierEntity>;
  delete(id: string): Promise<void>;
}
