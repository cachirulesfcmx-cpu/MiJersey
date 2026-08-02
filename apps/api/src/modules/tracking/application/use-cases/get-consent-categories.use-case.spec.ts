import { TrackingProviderEntity } from '../../domain/entities/tracking-provider.entity';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import { GetConsentCategoriesUseCase } from './get-consent-categories.use-case';

function buildProvider(consentCategory: string | null): TrackingProviderEntity {
  return new TrackingProviderEntity({
    id: `provider-${consentCategory ?? 'none'}`,
    provider: 'GOOGLE_ANALYTICS_4',
    status: 'ACTIVE',
    configuration: {},
    consentCategory,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetConsentCategoriesUseCase', () => {
  it('always includes "necessary" even without active providers', async () => {
    const providers: jest.Mocked<TrackingProviderRepositoryPort> = {
      findById: jest.fn(),
      findByProvider: jest.fn(),
      findMany: jest.fn(),
      findActive: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const useCase = new GetConsentCategoriesUseCase(providers);
    expect(await useCase.execute()).toEqual(['necessary']);
  });

  it('collects distinct consent categories from active providers, ignoring null', async () => {
    const providers: jest.Mocked<TrackingProviderRepositoryPort> = {
      findById: jest.fn(),
      findByProvider: jest.fn(),
      findMany: jest.fn(),
      findActive: jest
        .fn()
        .mockResolvedValue([
          buildProvider('analytics'),
          buildProvider('marketing'),
          buildProvider(null),
        ]),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const useCase = new GetConsentCategoriesUseCase(providers);
    expect(await useCase.execute()).toEqual(['necessary', 'analytics', 'marketing']);
  });
});
