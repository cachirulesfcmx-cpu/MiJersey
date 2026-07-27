import type { ProductOptionEntity } from '../../domain/entities/product-option.entity';

/** `true` si `optionValueIds` cubre cada opción del producto exactamente una vez. */
export function validateOptionValueIds(
  options: ProductOptionEntity[],
  optionValueIds: string[],
): boolean {
  if (optionValueIds.length !== options.length) return false;

  const valueIdToOptionId = new Map<string, string>();
  for (const option of options) {
    for (const value of option.values) {
      valueIdToOptionId.set(value.id, option.id);
    }
  }

  const coveredOptionIds = new Set<string>();
  for (const valueId of optionValueIds) {
    const optionId = valueIdToOptionId.get(valueId);
    if (!optionId || coveredOptionIds.has(optionId)) {
      return false;
    }
    coveredOptionIds.add(optionId);
  }

  return coveredOptionIds.size === options.length;
}
