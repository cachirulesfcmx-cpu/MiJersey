import { InvalidFilterQueryError } from '../../domain/errors/attribute.errors';
import type { AttributeFilterInput } from '../../domain/ports/product-query.port';

function isValidFilter(candidate: unknown): candidate is AttributeFilterInput {
  if (typeof candidate !== 'object' || candidate === null) return false;
  const filter = candidate as Record<string, unknown>;

  return (
    typeof filter.attributeId === 'string' &&
    (filter.valueIds === undefined ||
      (Array.isArray(filter.valueIds) && filter.valueIds.every((v) => typeof v === 'string'))) &&
    (filter.customValues === undefined ||
      (Array.isArray(filter.customValues) &&
        filter.customValues.every((v) => typeof v === 'string')))
  );
}

/** Parsea el query param `filters` (JSON) usado por `GET /filters` y `GET /products/search`. */
export function parseFiltersParam(raw?: string): AttributeFilterInput[] {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InvalidFilterQueryError();
  }

  if (!Array.isArray(parsed) || !parsed.every(isValidFilter)) {
    throw new InvalidFilterQueryError();
  }

  return parsed;
}
