import type { MediaAssetEntity } from '../entities/media-asset.entity';
import type { MediaAssetStatus, MediaType } from '../value-objects/media-enums';

export interface CreateMediaAssetData {
  filename: string;
  originalName: string;
  mimeType: string;
  type: MediaType;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  contentHash: string;
  storageKey: string;
  url: string;
  thumbnailUrl: string | null;
  folderId: string | null;
  title?: string | null;
  altText?: string | null;
}

export interface UpdateMediaAssetData {
  title?: string | null;
  altText?: string | null;
  folderId?: string | null;
  status?: MediaAssetStatus;
}

export interface ListMediaAssetsFilter {
  search?: string;
  folderId?: string;
  type?: MediaType;
  status?: MediaAssetStatus;
  tagId?: string;
}

export interface ListMediaAssetsParams {
  filter?: ListMediaAssetsFilter;
  page: number;
  pageSize: number;
}

export interface ListMediaAssetsResult {
  items: MediaAssetEntity[];
  total: number;
}

export interface MediaAssetRepositoryPort {
  findById(id: string): Promise<MediaAssetEntity | null>;
  findByContentHash(contentHash: string): Promise<MediaAssetEntity | null>;
  findMany(params: ListMediaAssetsParams): Promise<ListMediaAssetsResult>;
  create(data: CreateMediaAssetData): Promise<MediaAssetEntity>;
  update(id: string, data: UpdateMediaAssetData): Promise<MediaAssetEntity>;
  replaceTags(id: string, tagIds: string[]): Promise<void>;
  /** Borrado físico de la fila — el llamador ya validó que no existan referencias de uso. */
  delete(id: string): Promise<void>;
}
