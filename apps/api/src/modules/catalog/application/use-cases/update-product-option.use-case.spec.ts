import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { ProductOptionEntity } from '../../domain/entities/product-option.entity';
import { ProductOptionValueEntity } from '../../domain/entities/product-option-value.entity';
import { OptionValueInUseError } from '../../domain/errors/catalog.errors';
import type { ProductOptionRepositoryPort } from '../../domain/ports/product-option.repository.port';
import { UpdateProductOptionUseCase } from './update-product-option.use-case';

function buildOption(): ProductOptionEntity {
  return new ProductOptionEntity({
    id: 'option-1',
    productId: 'product-1',
    name: 'Talla',
    position: 0,
    values: [
      new ProductOptionValueEntity({
        id: 'value-s',
        optionId: 'option-1',
        value: 'S',
        position: 0,
      }),
      new ProductOptionValueEntity({
        id: 'value-m',
        optionId: 'option-1',
        value: 'M',
        position: 1,
      }),
    ],
  });
}

function buildUseCase(countUsingValue: number) {
  const options: jest.Mocked<ProductOptionRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(buildOption()),
    findByProductId: jest.fn(),
    existsByName: jest.fn().mockResolvedValue(false),
    create: jest.fn(),
    updateName: jest.fn(),
    replaceValues: jest.fn().mockResolvedValue(buildOption()),
    delete: jest.fn(),
    countVariantsUsingValue: jest.fn().mockResolvedValue(countUsingValue),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new UpdateProductOptionUseCase(options, auditLog), options };
}

describe('UpdateProductOptionUseCase', () => {
  it('rejects removing a value that a variant still uses', async () => {
    const { useCase } = buildUseCase(1);

    await expect(
      useCase.execute({ id: 'option-1', values: ['S'], actorUserId: 'staff-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(OptionValueInUseError);
  });

  it('replaces values when none of the removed ones are in use', async () => {
    const { useCase, options } = buildUseCase(0);

    await useCase.execute({
      id: 'option-1',
      values: ['S', 'L'],
      actorUserId: 'staff-1',
      ipAddress: null,
    });

    expect(options.replaceValues).toHaveBeenCalledWith('option-1', ['S', 'L']);
  });
});
