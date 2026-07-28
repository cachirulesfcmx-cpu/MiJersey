import { Inject, Injectable } from '@nestjs/common';

import type { RedirectRepositoryPort } from '../../domain/ports/redirect.repository.port';
import { REDIRECT_REPOSITORY } from '../../seo.constants';

export interface ResolvedRedirect {
  toPath: string;
  statusCode: number;
}

/** Consultado por el storefront (apps/web) para saber si una ruta debe redirigirse — spec §4/§8. */
@Injectable()
export class ResolveRedirectUseCase {
  constructor(@Inject(REDIRECT_REPOSITORY) private readonly redirects: RedirectRepositoryPort) {}

  async execute(fromPath: string): Promise<ResolvedRedirect | null> {
    const redirect = await this.redirects.findByFromPath(fromPath);
    return redirect ? { toPath: redirect.toPath, statusCode: redirect.statusCode } : null;
  }
}
