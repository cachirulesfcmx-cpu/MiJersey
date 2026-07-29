import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import type { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { ProductEntity, type ProductProps } from '../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductMediaRepositoryPort } from '../../domain/ports/product-media.repository.port';
import {
  ProductStatus,
  ProductType,
  ProductVisibility,
} from '../../domain/value-objects/product-enums';
import { SetProductGalleryUseCase } from './set-product-gallery.use-case';

function buildProduct(overrides: Partial<ProductProps> = {}): ProductEntity {
  return new ProductEntity({
    id: 'product-1',
    sku: 'JERSEY-HOME-26',
    slug: 'jersey-local-2026',
    name: 'Jersey Local 2026',
    shortDescription: null,
    description: null,
    status: ProductStatus.ACTIVE,
    visibility: ProductVisibility.PUBLIC,
    type: ProductType.PHYSICAL,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildUseCase(product: ProductEntity | null, existingMediaIds: string[]) {
  const products: jest.Mocked<ProductRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(product),
    findBySlug: jest.fn(),
    existsBySku: jest.fn(),
    existsBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    bulkUpdateStatus: jest.fn(),
    softDelete: jest.fn(),
    bulkSoftDelete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const media: jest.Mocked<ProductMediaRepositoryPort> = {
    list: jest
      .fn()
      .mockResolvedValue(existingMediaIds.map((mediaId, index) => ({ mediaId, sortOrder: index }))),
    replaceAll: jest.fn().mockResolvedValue(undefined),
  };
  const mediaUsage = {
    recordUsage: jest.fn().mockResolvedValue(undefined),
    removeUsage: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<MediaUsageService>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new SetProductGalleryUseCase(products, media, mediaUsage, auditLog),
    media,
    mediaUsage,
  };
}

describe('SetProductGalleryUseCase', () => {
  it('throws when the product does not exist', async () => {
    const { useCase } = buildUseCase(null, []);

    await expect(
      useCase.execute({
        productId: 'missing',
        mediaIds: ['media-1'],
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('records usage only for newly added media and releases usage only for removed media', async () => {
    const { useCase, media, mediaUsage } = buildUseCase(buildProduct(), ['media-1', 'media-2']);

    await useCase.execute({
      productId: 'product-1',
      mediaIds: ['media-2', 'media-3'],
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(mediaUsage.recordUsage).toHaveBeenCalledTimes(1);
    expect(mediaUsage.recordUsage).toHaveBeenCalledWith('media-3', 'product.gallery', 'product-1');
    expect(mediaUsage.removeUsage).toHaveBeenCalledTimes(1);
    expect(mediaUsage.removeUsage).toHaveBeenCalledWith('media-1', 'product.gallery', 'product-1');
    expect(media.replaceAll).toHaveBeenCalledWith('product-1', ['media-2', 'media-3']);
  });
});
