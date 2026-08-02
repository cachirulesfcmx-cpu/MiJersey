import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AnalyticsDashboardEntity } from '../../domain/entities/analytics-dashboard.entity';
import type { AnalyticsDashboardRepositoryPort } from '../../domain/ports/analytics-dashboard.repository.port';
import { CreateAnalyticsDashboardUseCase } from './create-analytics-dashboard.use-case';

describe('CreateAnalyticsDashboardUseCase', () => {
  it('creates the dashboard and records an audit entry', async () => {
    const created = new AnalyticsDashboardEntity({
      id: 'dash-1',
      name: 'Ventas',
      widgets: [],
      filters: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const dashboards: jest.Mocked<AnalyticsDashboardRepositoryPort> = {
      findById: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn().mockResolvedValue(created),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new CreateAnalyticsDashboardUseCase(dashboards, auditLog);
    const result = await useCase.execute({
      name: 'Ventas',
      widgets: [],
      actorUserId: 'admin-1',
      ipAddress: '127.0.0.1',
    });

    expect(dashboards.create).toHaveBeenCalledWith({ name: 'Ventas', widgets: [] });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'analytics.dashboard_created' }),
    );
    expect(result).toBe(created);
  });
});
