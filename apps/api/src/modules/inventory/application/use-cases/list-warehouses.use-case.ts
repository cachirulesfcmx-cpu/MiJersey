import { Inject, Injectable } from '@nestjs/common';

import type {
  ListWarehousesParams,
  ListWarehousesResult,
  WarehouseRepositoryPort,
} from '../../domain/ports/warehouse.repository.port';
import { WAREHOUSE_REPOSITORY } from '../../inventory.constants';

@Injectable()
export class ListWarehousesUseCase {
  constructor(@Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepositoryPort) {}

  async execute(params: ListWarehousesParams): Promise<ListWarehousesResult> {
    return this.warehouses.findMany(params);
  }
}
