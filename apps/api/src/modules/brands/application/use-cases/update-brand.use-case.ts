import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { SeoRedirectService } from '../../../seo/application/services/seo-redirect.service';
import { SeoEntityType } from '../../../seo/domain/value-objects/seo-enums';
import { BRAND_REPOSITORY } from '../../brands.constants';
import type { BrandEntity } from '../../domain/entities/brand.entity';
import {
  BrandNameAlreadyExistsError,
  BrandNotFoundError,
  BrandSlugAlreadyExistsError,
} from '../../domain/errors/brand.errors';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';
import type { BrandStatus } from '../../domain/value-objects/brand-status';
import { Slug } from '../../domain/value-objects/slug.vo';

const BRAND_LOGO_REFERENCE_TYPE = 'brand.logo';
const BRAND_COVER_REFERENCE_TYPE = 'brand.cover';

export interface UpdateBrandInput {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  logoMediaId?: string | null;
  coverMediaId?: string | null;
  website?: string | null;
  country?: string | null;
  status?: BrandStatus;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly mediaUsage: MediaUsageService,
    private readonly seoRedirect: SeoRedirectService,
  ) {}

  async execute(input: UpdateBrandInput): Promise<BrandEntity> {
    const existing = await this.brands.findById(input.id);
    if (!existing) {
      throw new BrandNotFoundError();
    }

    let slug: string | undefined;
    if (input.slug?.trim()) {
      slug = Slug.create(input.slug).toString();
      if (slug !== existing.slug && (await this.brands.existsBySlug(slug))) {
        throw new BrandSlugAlreadyExistsError();
      }
    }

    if (input.name?.trim() && input.name.trim() !== existing.name) {
      if (await this.brands.existsByName(input.name.trim())) {
        throw new BrandNameAlreadyExistsError();
      }
    }

    await this.syncMediaUsage(
      existing.id,
      BRAND_LOGO_REFERENCE_TYPE,
      existing.logoMediaId,
      input.logoMediaId,
    );
    await this.syncMediaUsage(
      existing.id,
      BRAND_COVER_REFERENCE_TYPE,
      existing.coverMediaId,
      input.coverMediaId,
    );

    const updated = await this.brands.update(input.id, {
      ...(slug !== undefined ? { slug } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.shortDescription !== undefined
        ? { shortDescription: input.shortDescription?.trim() || null }
        : {}),
      ...(input.logoMediaId !== undefined ? { logoMediaId: input.logoMediaId } : {}),
      ...(input.coverMediaId !== undefined ? { coverMediaId: input.coverMediaId } : {}),
      ...(input.website !== undefined ? { website: input.website?.trim() || null } : {}),
      ...(input.country !== undefined ? { country: input.country?.trim() || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });

    if (slug !== undefined && slug !== existing.slug) {
      await this.seoRedirect.recordSlugChange(SeoEntityType.BRAND, existing.slug, slug);
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'brand.updated',
      ipAddress: input.ipAddress,
      metadata: { brandId: updated.id },
    });

    return updated;
  }

  /** Si el media cambia, quita la referencia de uso anterior y registra la nueva (spec §5 de 010, "mantener historial de uso"). */
  private async syncMediaUsage(
    brandId: string,
    referenceType: string,
    previousMediaId: string | null,
    nextMediaId: string | null | undefined,
  ): Promise<void> {
    if (nextMediaId === undefined || nextMediaId === previousMediaId) {
      return;
    }

    if (previousMediaId) {
      await this.mediaUsage.removeUsage(previousMediaId, referenceType, brandId);
    }
    if (nextMediaId) {
      await this.mediaUsage.recordUsage(nextMediaId, referenceType, brandId);
    }
  }
}
