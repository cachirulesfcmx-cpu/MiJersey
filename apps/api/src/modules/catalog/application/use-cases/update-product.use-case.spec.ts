import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import type { SeoRedirectService } from '../../../seo/application/services/seo-redirect.service';
import { ProductEntity, type ProductProps } from '../../domain/entities/product.entity';
import { ProductNotFoundError, SlugAlreadyExistsError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import {
  ProductStatus,
  ProductType,
  ProductVisibility,
} from '../../domain/value-objects/product-enums';
import { UpdateProductUseCase } from './update-product.use-case';

function buildProduct(overrides: Partial<ProductProps> = {}): ProductEntity {
  return new ProductEntity({
    id: 'product-1',
    sku: 'JERSEY-HOME-26',
    slug: 'jersey-local-2026',
    name: 'Jersey Local 2026',
    shortDescription: null,
    description: null,
    status: ProductStatus.DRAFT,
    visibility: ProductVisibility.HIDDEN,
    type: ProductType.PHYSICAL,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildUseCase(existing: ProductEntity | null, slugOwner: ProductEntity | null) {
  const products: jest.Mocked<ProductRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(existing),
    findBySlug: jest.fn().mockResolvedValue(slugOwner),
    existsBySku: jest.fn(),
    existsBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue(buildProduct({ name: 'Nuevo nombre' })),
    updateStatus: jest.fn(),
    bulkUpdateStatus: jest.fn(),
    softDelete: jest.fn(),
    bulkSoftDelete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const seoRedirect = {
    recordSlugChange: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SeoRedirectService>;

  const useCase = new UpdateProductUseCase(products, auditLog, seoRedirect);
  return { useCase, products, auditLog, seoRedirect };
}

describe('UpdateProductUseCase', () => {
  it('updates a product that exists', async () => {
    const product = buildProduct();
    const { useCase, products } = buildUseCase(product, null);

    await useCase.execute({
      id: product.id,
      name: 'Nuevo nombre',
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(products.update).toHaveBeenCalledWith(product.id, { name: 'Nuevo nombre' });
  });

  it('rejects updating a product that does not exist', async () => {
    const { useCase } = buildUseCase(null, null);

    await expect(
      useCase.execute({ id: 'missing', name: 'x', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('rejects a slug already used by a different product', async () => {
    const product = buildProduct();
    const otherOwner = buildProduct({ id: 'product-2', slug: 'otro-slug' });
    const { useCase } = buildUseCase(product, otherOwner);

    await expect(
      useCase.execute({
        id: product.id,
        slug: 'otro-slug',
        actorUserId: 'staff-1',
        ipAddress: null,
      }),
    ).rejects.toBeInstanceOf(SlugAlreadyExistsError);
  });

  it('allows keeping the same slug on the same product', async () => {
    const product = buildProduct();
    const { useCase, products } = buildUseCase(product, product);

    await useCase.execute({
      id: product.id,
      slug: product.slug,
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(products.update).toHaveBeenCalledWith(product.id, { slug: product.slug });
  });
});
