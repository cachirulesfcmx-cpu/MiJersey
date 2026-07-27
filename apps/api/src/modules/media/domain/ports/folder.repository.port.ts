import type { FolderEntity } from '../entities/folder.entity';

export interface CreateFolderData {
  name: string;
  slug: string;
  parentId: string | null;
}

export interface UpdateFolderData {
  name?: string;
  slug?: string;
}

export interface FolderRepositoryPort {
  findById(id: string): Promise<FolderEntity | null>;
  findBySlug(slug: string): Promise<FolderEntity | null>;
  existsBySlug(slug: string): Promise<boolean>;
  findAll(): Promise<FolderEntity[]>;
  create(data: CreateFolderData): Promise<FolderEntity>;
  update(id: string, data: UpdateFolderData): Promise<FolderEntity>;
  move(id: string, parentId: string | null): Promise<FolderEntity>;
  delete(id: string): Promise<void>;
  hasChildren(id: string): Promise<boolean>;
  countAssets(id: string): Promise<number>;
}
