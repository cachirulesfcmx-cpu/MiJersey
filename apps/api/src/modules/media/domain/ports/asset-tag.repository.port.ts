import type { AssetTagEntity } from '../entities/asset-tag.entity';

export interface AssetTagRepositoryPort {
  findById(id: string): Promise<AssetTagEntity | null>;
  findByIds(ids: string[]): Promise<AssetTagEntity[]>;
  findAll(): Promise<AssetTagEntity[]>;
  /** Busca las etiquetas por nombre y crea las que no existan (spec: asignar etiquetas libres al subir/editar un archivo). */
  findOrCreateByNames(names: string[]): Promise<AssetTagEntity[]>;
}
