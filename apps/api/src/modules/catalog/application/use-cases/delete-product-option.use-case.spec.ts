import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { ProductOptionEntity } from '../../domain/entities/product-option.entity';
import {
  ProductHasVariantsError,
  ProductOptionNotFoundError,
} from '../../domain/errors/catalog.errors';
import type { ProductOptionRepositoryPort } from '../../domain/ports/product-option.repository.port';
import type { ProductVariantRepositoryPort } from '../../domain/ports/product-variant.repository.port';
import { DeleteProductOptionUseCase } from './delete-product-option.use-case';

function buildOption(): ProductOptionEntity {
  return new ProductOptionEntity({
    id: 'option-1',
    productId: 'product-1',
    name: 'Talla',
    position: 0,
    values: [],
  });
}

function buildUseCase(option: ProductOptionEntity | null, variantTotal: number) {
  const options = {
    findById: jest.fn().mockResolvedValue(option),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ProductOptionRepositoryPort>;
  const variants = {
    findMany: jest.fn().mockResolvedValue({ items: [], total: variantTotal }),
  } as unknown as jest.Mocked<ProductVariantRepositoryPort>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new DeleteProductOptionUseCase(options, variants, auditLog), options };
}

describe('DeleteProductOptionUseCase', () => {
  it('rejects deleting an option when the product has variants', async () => {
    const { useCase } = buildUseCase(buildOption(), 3);

    await expect(
      useCase.execute({ id: 'option-1', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(ProductHasVariantsError);
  });

  it('rejects deleting an option that does not exist', async () => {
    const { useCase } = buildUseCase(null, 0);

    await expect(
      useCase.execute({ id: 'missing', actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(ProductOptionNotFoundError);
  });

  it('deletes an option when the product has no variants', async () => {
    const { useCase, options } = buildUseCase(buildOption(), 0);

    await useCase.execute({ id: 'option-1', actorUserId: 'staff-1', ipAddress: null });

    expect(options.delete).toHaveBeenCalledWith('option-1');
  });
});
