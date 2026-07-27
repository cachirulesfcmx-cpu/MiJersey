import { Inject, Injectable } from '@nestjs/common';

import type { InventoryItemEntity } from '../../domain/entities/inventory-item.entity';
import { VariantNotFoundError } from '../../domain/errors/inventory.errors';
import type { InventoryItemRepositoryPort } from '../../domain/ports/inventory-item.repository.port';
import type { VariantQueryPort } from '../../domain/ports/variant-query.port';
import { INVENTORY_ITEM_REPOSITORY, VARIANT_QUERY } from '../../inventory.constants';

/** Devuelve el inventario de una variante en todos los almacenes (GET /inventory/:variantId). */
@Injectable()
export class GetInventoryItemUseCase {
  constructor(
    @Inject(INVENTORY_ITEM_REPOSITORY) private readonly items: InventoryItemRepositoryPort,
    @Inject(VARIANT_QUERY) private readonly variantQuery: VariantQueryPort,
  ) {}

  async execute(variantId: string): Promise<InventoryItemEntity[]> {
    if (!(await this.variantQuery.exists(variantId))) {
      throw new VariantNotFoundError();
    }

    return this.items.findByVariant(variantId);
  }
}
