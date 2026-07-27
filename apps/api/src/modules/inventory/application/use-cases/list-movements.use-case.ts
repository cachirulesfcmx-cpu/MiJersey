import { Inject, Injectable } from '@nestjs/common';

import type {
  InventoryMovementRepositoryPort,
  ListMovementsParams,
  ListMovementsResult,
} from '../../domain/ports/inventory-movement.repository.port';
import { INVENTORY_MOVEMENT_REPOSITORY } from '../../inventory.constants';

@Injectable()
export class ListMovementsUseCase {
  constructor(
    @Inject(INVENTORY_MOVEMENT_REPOSITORY)
    private readonly movements: InventoryMovementRepositoryPort,
  ) {}

  async execute(params: ListMovementsParams): Promise<ListMovementsResult> {
    return this.movements.findMany(params);
  }
}
