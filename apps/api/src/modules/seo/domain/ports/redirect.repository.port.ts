import type { RedirectEntity } from '../entities/redirect.entity';

export interface CreateRedirectData {
  fromPath: string;
  toPath: string;
  statusCode: number;
}

export interface ListRedirectsParams {
  page: number;
  pageSize: number;
}

export interface ListRedirectsResult {
  items: RedirectEntity[];
  total: number;
}

export interface RedirectRepositoryPort {
  findById(id: string): Promise<RedirectEntity | null>;
  findByFromPath(fromPath: string): Promise<RedirectEntity | null>;
  findMany(params: ListRedirectsParams): Promise<ListRedirectsResult>;
  create(data: CreateRedirectData): Promise<RedirectEntity>;
  /** Usado por `SeoRedirectService` al cambiar un slug: sobrescribe el destino si `fromPath` ya tenía una redirección. */
  upsertByFromPath(data: CreateRedirectData): Promise<RedirectEntity>;
  delete(id: string): Promise<void>;
}
