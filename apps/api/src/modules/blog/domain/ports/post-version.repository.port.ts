import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { PostSnapshot, PostVersionEntity } from '../entities/post-version.entity';

export interface CreatePostVersionData {
  postId: string;
  snapshot: PostSnapshot;
}

export interface PostVersionRepositoryPort {
  findByPostAndNumber(postId: string, versionNumber: number): Promise<PostVersionEntity | null>;
  findMany(postId: string, params: PaginationParams): Promise<PaginatedResult<PostVersionEntity>>;
  getNextVersionNumber(postId: string): Promise<number>;
  create(data: CreatePostVersionData): Promise<PostVersionEntity>;
}
