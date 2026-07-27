import { Inject, Injectable } from '@nestjs/common';

import type { WarehouseEntity } from '../../domain/entities/warehouse.entity';
import { WarehouseNotFoundError } from '../../domain/errors/inventory.errors';
import type { WarehouseRepositoryPort } from '../../domain/ports/warehouse.repository.port';
import { WAREHOUSE_REPOSITORY } from '../../inventory.constants';

@Injectable()
export class GetWarehouseUseCase {
  constructor(@Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepositoryPort) {}

  async execute(id: string): Promise<WarehouseEntity> {
    const warehouse = await this.warehouses.findById(id);
    if (!warehouse) {
      throw new WarehouseNotFoundError();
    }
    return warehouse;
  }
}
