import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type { ThemeVersionEntity } from '../../domain/entities/theme-version.entity';
import type { ThemeVersionRepositoryPort } from '../../domain/ports/theme-version.repository.port';
import { THEME_VERSION_REPOSITORY } from '../../theme.constants';

@Injectable()
export class ListThemeVersionsUseCase {
  constructor(
    @Inject(THEME_VERSION_REPOSITORY) private readonly versions: ThemeVersionRepositoryPort,
  ) {}

  async execute(params: PaginationParams): Promise<PaginatedResult<ThemeVersionEntity>> {
    return this.versions.findMany(params);
  }
}
