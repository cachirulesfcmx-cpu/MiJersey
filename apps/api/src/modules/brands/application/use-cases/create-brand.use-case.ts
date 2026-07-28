import { slugify } from '@mijersey/shared-utils';
import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { BRAND_REPOSITORY } from '../../brands.constants';
import type { BrandEntity } from '../../domain/entities/brand.entity';
import {
  BrandNameAlreadyExistsError,
  BrandSlugAlreadyExistsError,
} from '../../domain/errors/brand.errors';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';
import { Slug } from '../../domain/value-objects/slug.vo';

const BRAND_LOGO_REFERENCE_TYPE = 'brand.logo';
const BRAND_COVER_REFERENCE_TYPE = 'brand.cover';

export interface CreateBrandInput {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  logoMediaId?: string;
  coverMediaId?: string;
  website?: string;
  country?: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly mediaUsage: MediaUsageService,
  ) {}

  async execute(input: CreateBrandInput): Promise<BrandEntity> {
    const slug = Slug.create(input.slug?.trim() ? input.slug : slugify(input.name)).toString();

    if (await this.brands.existsBySlug(slug)) {
      throw new BrandSlugAlreadyExistsError();
    }
    if (await this.brands.existsByName(input.name.trim())) {
      throw new BrandNameAlreadyExistsError();
    }

    const brand = await this.brands.create({
      slug,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      shortDescription: input.shortDescription?.trim() || null,
      logoMediaId: input.logoMediaId ?? null,
      coverMediaId: input.coverMediaId ?? null,
      website: input.website?.trim() || null,
      country: input.country?.trim() || null,
    });

    if (input.logoMediaId) {
      await this.mediaUsage.recordUsage(input.logoMediaId, BRAND_LOGO_REFERENCE_TYPE, brand.id);
    }
    if (input.coverMediaId) {
      await this.mediaUsage.recordUsage(input.coverMediaId, BRAND_COVER_REFERENCE_TYPE, brand.id);
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'brand.created',
      ipAddress: input.ipAddress,
      metadata: { brandId: brand.id },
    });

    return brand;
  }
}
