import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AnalyticsDashboardEntity } from '../../domain/entities/analytics-dashboard.entity';
import { AnalyticsDashboardNotFoundError } from '../../domain/errors/analytics.errors';
import type { AnalyticsDashboardRepositoryPort } from '../../domain/ports/analytics-dashboard.repository.port';
import { DeleteAnalyticsDashboardUseCase } from './delete-analytics-dashboard.use-case';

function buildUseCase(options: { existing?: AnalyticsDashboardEntity | null } = {}) {
  const existing =
    options.existing === undefined
      ? new AnalyticsDashboardEntity({
          id: 'dash-1',
          name: 'Ventas',
          widgets: [],
          filters: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      : options.existing;

  const dashboards: jest.Mocked<AnalyticsDashboardRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(existing),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new DeleteAnalyticsDashboardUseCase(dashboards, auditLog),
    dashboards,
    auditLog,
  };
}

describe('DeleteAnalyticsDashboardUseCase', () => {
  it('throws AnalyticsDashboardNotFoundError when the dashboard does not exist', async () => {
    const { useCase } = buildUseCase({ existing: null });

    await expect(
      useCase.execute({ id: 'dash-1', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(AnalyticsDashboardNotFoundError);
  });

  it('deletes the dashboard and audits it', async () => {
    const { useCase, dashboards, auditLog } = buildUseCase();

    await useCase.execute({ id: 'dash-1', actorUserId: 'admin-1', ipAddress: '127.0.0.1' });

    expect(dashboards.delete).toHaveBeenCalledWith('dash-1');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'analytics.dashboard_deleted',
        metadata: { dashboardId: 'dash-1' },
      }),
    );
  });
});
