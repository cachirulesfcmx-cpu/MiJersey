import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AddressEntity } from '../../domain/entities/address.entity';
import { AddressNotFoundError } from '../../domain/errors/customer.errors';
import type { AddressRepositoryPort } from '../../domain/ports/address.repository.port';
import { AddressType } from '../../domain/value-objects/address-enums';
import { UpdateAddressUseCase } from './update-address.use-case';

function buildAddress(
  overrides: Partial<{
    id: string;
    customerId: string;
    type: AddressType;
    isDefault: boolean;
  }> = {},
): AddressEntity {
  return new AddressEntity({
    id: overrides.id ?? 'address-1',
    customerId: overrides.customerId ?? 'customer-1',
    type: overrides.type ?? AddressType.SHIPPING,
    firstName: 'Ana',
    lastName: 'Pérez',
    company: null,
    addressLine1: 'Av. Reforma 123',
    addressLine2: null,
    city: 'CDMX',
    state: 'CDMX',
    postalCode: '06600',
    country: 'MX',
    phone: null,
    isDefault: overrides.isDefault ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: {
  existing: AddressEntity | null;
  previousDefault?: AddressEntity | null;
}) {
  const addresses: jest.Mocked<AddressRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(options.existing),
    findByCustomerId: jest.fn(),
    findDefaultByType: jest.fn().mockResolvedValue(options.previousDefault ?? null),
    create: jest.fn(),
    update: jest.fn().mockImplementation(async () => buildAddress({ isDefault: true })),
    unsetDefault: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new UpdateAddressUseCase(addresses, auditLog), addresses, auditLog };
}

describe('UpdateAddressUseCase', () => {
  it('throws when the address does not exist', async () => {
    const { useCase } = buildUseCase({ existing: null });

    await expect(
      useCase.execute({ id: 'address-1', customerId: 'customer-1' }),
    ).rejects.toBeInstanceOf(AddressNotFoundError);
  });

  it('throws when the address belongs to a different customer (reported as not-found, not forbidden)', async () => {
    const existing = buildAddress({ customerId: 'someone-else' });
    const { useCase } = buildUseCase({ existing });

    await expect(
      useCase.execute({ id: 'address-1', customerId: 'customer-1' }),
    ).rejects.toBeInstanceOf(AddressNotFoundError);
  });

  it('unsets the previous default of the same type when marking this one as default', async () => {
    const existing = buildAddress({ id: 'address-1', isDefault: false });
    const previousDefault = buildAddress({ id: 'address-old', isDefault: true });
    const { useCase, addresses } = buildUseCase({ existing, previousDefault });

    await useCase.execute({ id: 'address-1', customerId: 'customer-1', isDefault: true });

    expect(addresses.unsetDefault).toHaveBeenCalledWith('address-old');
  });

  it('does not unset itself if it is already the default being updated', async () => {
    const existing = buildAddress({ id: 'address-1', isDefault: true });
    const { useCase, addresses } = buildUseCase({ existing, previousDefault: existing });

    await useCase.execute({ id: 'address-1', customerId: 'customer-1', isDefault: true });

    expect(addresses.unsetDefault).not.toHaveBeenCalled();
  });
});
