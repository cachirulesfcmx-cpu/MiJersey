import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AnalyticsDashboardEntity } from '../../domain/entities/analytics-dashboard.entity';
import { AnalyticsDashboardNotFoundError } from '../../domain/errors/analytics.errors';
import type { AnalyticsDashboardRepositoryPort } from '../../domain/ports/analytics-dashboard.repository.port';
import { UpdateAnalyticsDashboardUseCase } from './update-analytics-dashboard.use-case';

function buildDashboard(): AnalyticsDashboardEntity {
  return new AnalyticsDashboardEntity({
    id: 'dash-1',
    name: 'Ventas',
    widgets: [],
    filters: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { existing?: AnalyticsDashboardEntity | null } = {}) {
  const dashboards: jest.Mocked<AnalyticsDashboardRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.existing === undefined ? buildDashboard() : options.existing),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue(buildDashboard()),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new UpdateAnalyticsDashboardUseCase(dashboards, auditLog),
    dashboards,
    auditLog,
  };
}

describe('UpdateAnalyticsDashboardUseCase', () => {
  it('throws AnalyticsDashboardNotFoundError when the dashboard does not exist', async () => {
    const { useCase } = buildUseCase({ existing: null });

    await expect(
      useCase.execute({ id: 'dash-1', name: 'x', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(AnalyticsDashboardNotFoundError);
  });

  it('updates only the provided fields and audits the change', async () => {
    const { useCase, dashboards, auditLog } = buildUseCase();

    await useCase.execute({
      id: 'dash-1',
      name: 'Nuevo nombre',
      actorUserId: 'admin-1',
      ipAddress: '127.0.0.1',
    });

    expect(dashboards.update).toHaveBeenCalledWith('dash-1', { name: 'Nuevo nombre' });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'analytics.dashboard_updated',
        metadata: { dashboardId: 'dash-1', updatedFields: ['name'] },
      }),
    );
  });
});
