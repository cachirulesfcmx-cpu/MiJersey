import { Inject, Injectable } from '@nestjs/common';

import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { PRODUCT_MEDIA_REPOSITORY, PRODUCT_REPOSITORY } from '../../catalog.constants';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductMediaRepositoryPort } from '../../domain/ports/product-media.repository.port';

export interface ProductGalleryItemView {
  mediaId: string;
  sortOrder: number;
  url: string | null;
  thumbnailUrl: string | null;
}

/** Galería ya resuelta a URLs — para que el editor admin muestre miniaturas sin una llamada aparte por imagen. */
@Injectable()
export class GetProductGalleryUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(PRODUCT_MEDIA_REPOSITORY) private readonly media: ProductMediaRepositoryPort,
    private readonly mediaUsage: MediaUsageService,
  ) {}

  async execute(productId: string): Promise<ProductGalleryItemView[]> {
    if (!(await this.products.findById(productId))) {
      throw new ProductNotFoundError();
    }

    const items = await this.media.list(productId);
    return Promise.all(
      items.map(async (item) => {
        const resolved = await this.mediaUsage.resolveUrls(item.mediaId);
        return {
          mediaId: item.mediaId,
          sortOrder: item.sortOrder,
          url: resolved?.url ?? null,
          thumbnailUrl: resolved?.thumbnailUrl ?? null,
        };
      }),
    );
  }
}
