import type { WarehouseEntity } from '../entities/warehouse.entity';
import type { WarehouseStatus } from '../value-objects/inventory-enums';

export interface CreateWarehouseData {
  code: string;
  name: string;
}

export interface UpdateWarehouseData {
  name?: string;
  status?: WarehouseStatus;
}

export interface ListWarehousesFilter {
  search?: string;
  status?: WarehouseStatus;
}

export interface ListWarehousesParams {
  filter?: ListWarehousesFilter;
  page: number;
  pageSize: number;
}

export interface ListWarehousesResult {
  items: WarehouseEntity[];
  total: number;
}

export interface WarehouseRepositoryPort {
  findById(id: string): Promise<WarehouseEntity | null>;
  findByCode(code: string): Promise<WarehouseEntity | null>;
  existsByCode(code: string): Promise<boolean>;
  findAllActive(): Promise<WarehouseEntity[]>;
  findMany(params: ListWarehousesParams): Promise<ListWarehousesResult>;
  create(data: CreateWarehouseData): Promise<WarehouseEntity>;
  update(id: string, data: UpdateWarehouseData): Promise<WarehouseEntity>;
}
