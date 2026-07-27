import type { ProductAttributeEntity } from '../entities/product-attribute.entity';

export interface AssignAttributeData {
  attributeId: string;
  valueId?: string | null;
  customValue?: string | null;
}

export interface ProductAttributeRepositoryPort {
  findByProduct(productId: string): Promise<ProductAttributeEntity[]>;
  findOne(productId: string, attributeId: string): Promise<ProductAttributeEntity | null>;
  upsert(productId: string, data: AssignAttributeData): Promise<ProductAttributeEntity>;
  remove(productId: string, attributeId: string): Promise<void>;
  /** Reemplaza todas las asignaciones del producto en una sola operación ("acciones masivas"). */
  replaceForProduct(productId: string, items: AssignAttributeData[]): Promise<void>;
}
