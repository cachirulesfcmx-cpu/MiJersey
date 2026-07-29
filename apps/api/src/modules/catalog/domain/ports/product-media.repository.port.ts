export interface ProductMediaItem {
  mediaId: string;
  sortOrder: number;
}

export interface ProductMediaRepositoryPort {
  list(productId: string): Promise<ProductMediaItem[]>;
  /** Reemplaza toda la galería por `mediaIds`, en ese orden (índice = sortOrder). */
  replaceAll(productId: string, mediaIds: string[]): Promise<void>;
}
