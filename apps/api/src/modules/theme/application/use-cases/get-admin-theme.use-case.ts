import { Inject, Injectable } from '@nestjs/common';

import type { ThemeState, ThemeStateView } from '../../domain/entities/theme-state';
import { toThemeStateView } from '../../domain/entities/theme-state';
import type { ThemeRepositoryPort } from '../../domain/ports/theme.repository.port';
import { THEME_REPOSITORY } from '../../theme.constants';

@Injectable()
export class GetAdminThemeUseCase {
  constructor(@Inject(THEME_REPOSITORY) private readonly theme: ThemeRepositoryPort) {}

  async execute(): Promise<ThemeStateView> {
    const state: ThemeState = await this.theme.getState();
    return toThemeStateView(state);
  }
}
