import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AddressEntity } from '../../domain/entities/address.entity';
import type {
  AddressRepositoryPort,
  CreateAddressData,
} from '../../domain/ports/address.repository.port';
import { AddressType } from '../../domain/value-objects/address-enums';
import { CreateAddressUseCase } from './create-address.use-case';

function buildAddress(overrides: Partial<{ id: string; isDefault: boolean }> = {}): AddressEntity {
  return new AddressEntity({
    id: overrides.id ?? 'address-1',
    customerId: 'customer-1',
    type: AddressType.SHIPPING,
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

function buildInput(overrides: Partial<CreateAddressData> = {}): CreateAddressData {
  return {
    customerId: 'customer-1',
    type: AddressType.SHIPPING,
    firstName: 'Ana',
    lastName: 'Pérez',
    addressLine1: 'Av. Reforma 123',
    city: 'CDMX',
    state: 'CDMX',
    postalCode: '06600',
    country: 'MX',
    ...overrides,
  };
}

function buildUseCase(options: { existingDefault?: AddressEntity | null } = {}) {
  const addresses: jest.Mocked<AddressRepositoryPort> = {
    findById: jest.fn(),
    findByCustomerId: jest.fn(),
    findDefaultByType: jest.fn().mockResolvedValue(options.existingDefault ?? null),
    create: jest
      .fn()
      .mockImplementation(async (data: CreateAddressData) =>
        buildAddress({ isDefault: data.isDefault ?? false }),
      ),
    update: jest.fn(),
    unsetDefault: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new CreateAddressUseCase(addresses, auditLog), addresses, auditLog };
}

describe('CreateAddressUseCase', () => {
  it('creates the address without touching any previous default when isDefault is not set', async () => {
    const { useCase, addresses } = buildUseCase();

    await useCase.execute(buildInput());

    expect(addresses.findDefaultByType).not.toHaveBeenCalled();
    expect(addresses.unsetDefault).not.toHaveBeenCalled();
  });

  it('unsets the previous default of the same type when the new address is marked as default', async () => {
    const previousDefault = buildAddress({ id: 'address-old', isDefault: true });
    const { useCase, addresses } = buildUseCase({ existingDefault: previousDefault });

    await useCase.execute(buildInput({ isDefault: true }));

    expect(addresses.findDefaultByType).toHaveBeenCalledWith('customer-1', AddressType.SHIPPING);
    expect(addresses.unsetDefault).toHaveBeenCalledWith('address-old');
  });

  it('does not call unsetDefault when there was no previous default', async () => {
    const { useCase, addresses } = buildUseCase({ existingDefault: null });

    await useCase.execute(buildInput({ isDefault: true }));

    expect(addresses.unsetDefault).not.toHaveBeenCalled();
  });

  it('records an audit log entry', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute(buildInput());

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'customer.address_created' }),
    );
  });
});
