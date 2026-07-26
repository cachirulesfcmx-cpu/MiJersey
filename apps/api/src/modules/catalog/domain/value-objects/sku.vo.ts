import { InvalidSkuError } from '../errors/catalog.errors';

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-]{1,62}[A-Z0-9]$/;

export class Sku {
  private constructor(private readonly value: string) {}

  static create(raw: string): Sku {
    const normalized = raw.trim().toUpperCase();

    if (!SKU_PATTERN.test(normalized)) {
      throw new InvalidSkuError(raw);
    }

    return new Sku(normalized);
  }

  toString(): string {
    return this.value;
  }
}
