import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { ThemeSnapshot, ThemeVersionEntity } from '../entities/theme-version.entity';

export interface ThemeVersionRepositoryPort {
  findByNumber(versionNumber: number): Promise<ThemeVersionEntity | null>;
  findMany(params: PaginationParams): Promise<PaginatedResult<ThemeVersionEntity>>;
  getNextVersionNumber(): Promise<number>;
  create(snapshot: ThemeSnapshot): Promise<ThemeVersionEntity>;
}
