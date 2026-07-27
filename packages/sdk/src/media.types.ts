export type MediaAssetStatus = 'ACTIVE' | 'ARCHIVED';
export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export interface AssetTag {
  id: string;
  name: string;
  slug: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  type: MediaType;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  altText: string | null;
  title: string | null;
  status: MediaAssetStatus;
  contentHash: string;
  storageKey: string;
  url: string;
  thumbnailUrl: string | null;
  folderId: string | null;
  tags: AssetTag[];
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  createdAt: string;
}

export interface FolderTreeNode extends Folder {
  children: FolderTreeNode[];
}

export interface UploadMediaInput {
  file: Blob;
  folderId?: string;
  title?: string;
  altText?: string;
  tags?: string[];
}

export interface UpdateMediaInput {
  title?: string | null;
  altText?: string | null;
  folderId?: string | null;
  status?: MediaAssetStatus;
  tags?: string[];
}

export interface ListMediaParams {
  page?: number;
  pageSize?: number;
  search?: string;
  folderId?: string;
  type?: MediaType;
  status?: MediaAssetStatus;
  tagId?: string;
}

export interface CreateFolderInput {
  name: string;
  slug?: string;
  parentId?: string;
}

export interface UpdateFolderInput {
  name?: string;
  slug?: string;
}
