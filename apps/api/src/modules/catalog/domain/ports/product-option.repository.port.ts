import type { ProductOptionEntity } from '../entities/product-option.entity';

export interface CreateOptionData {
  productId: string;
  name: string;
  position: number;
  values: string[];
}

export interface ProductOptionRepositoryPort {
  findById(id: string): Promise<ProductOptionEntity | null>;
  findByProductId(productId: string): Promise<ProductOptionEntity[]>;
  existsByName(productId: string, name: string, excludeId?: string): Promise<boolean>;
  create(data: CreateOptionData): Promise<ProductOptionEntity>;
  updateName(id: string, name: string): Promise<ProductOptionEntity>;
  /** Agrega los valores nuevos, quita los que ya no estén en `values` y ajusta su orden. */
  replaceValues(optionId: string, values: string[]): Promise<ProductOptionEntity>;
  delete(id: string): Promise<void>;
  countVariantsUsingValue(valueId: string): Promise<number>;
}
