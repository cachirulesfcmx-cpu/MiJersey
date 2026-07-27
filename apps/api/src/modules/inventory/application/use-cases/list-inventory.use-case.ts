import { Inject, Injectable } from '@nestjs/common';

import type { InventoryItemEntity } from '../../domain/entities/inventory-item.entity';
import type { InventoryItemRepositoryPort } from '../../domain/ports/inventory-item.repository.port';
import type { VariantQueryPort, VariantSummary } from '../../domain/ports/variant-query.port';
import { INVENTORY_ITEM_REPOSITORY, VARIANT_QUERY } from '../../inventory.constants';

export interface ListInventoryInput {
  search?: string;
  warehouseId?: string;
  belowSafetyStock?: boolean;
  page: number;
  pageSize: number;
}

export interface InventoryListView {
  item: InventoryItemEntity;
  variant: VariantSummary | null;
}

export interface ListInventoryResultView {
  items: InventoryListView[];
  total: number;
}

@Injectable()
export class ListInventoryUseCase {
  constructor(
    @Inject(INVENTORY_ITEM_REPOSITORY) private readonly items: InventoryItemRepositoryPort,
    @Inject(VARIANT_QUERY) private readonly variantQuery: VariantQueryPort,
  ) {}

  async execute(input: ListInventoryInput): Promise<ListInventoryResultView> {
    let variantIds: string[] | undefined;

    if (input.search?.trim()) {
      const matches = await this.variantQuery.search(input.search.trim(), 1, 100);
      variantIds = matches.items.map((variant) => variant.id);

      if (variantIds.length === 0) {
        return { items: [], total: 0 };
      }
    }

    const result = await this.items.findMany({
      page: input.page,
      pageSize: input.pageSize,
      filter: {
        ...(input.warehouseId ? { warehouseId: input.warehouseId } : {}),
        ...(input.belowSafetyStock !== undefined
          ? { belowSafetyStock: input.belowSafetyStock }
          : {}),
        ...(variantIds ? { variantIds } : {}),
      },
    });

    const variants = await this.variantQuery.findByIds([
      ...new Set(result.items.map((item) => item.variantId)),
    ]);
    const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

    return {
      items: result.items.map((item) => ({
        item,
        variant: variantsById.get(item.variantId) ?? null,
      })),
      total: result.total,
    };
  }
}
