import { Injectable } from '@nestjs/common';

import { GetProductStatsUseCase } from '../../../catalog/application/use-cases/get-product-stats.use-case';
import { GetUserStatsUseCase } from '../../../identity/application/use-cases/get-user-stats.use-case';

export interface MetricValue {
  value: number;
  /** false cuando el módulo de negocio que provee este dato aún no existe. */
  available: boolean;
}

export interface DashboardMetrics {
  customers: MetricValue;
  staff: MetricValue;
  activeUsers: MetricValue;
  sales: MetricValue;
  orders: MetricValue;
  products: MetricValue;
  revenue: MetricValue;
  conversionRate: MetricValue;
  inventoryAlerts: MetricValue;
}

/**
 * Contrato de métricas del dashboard. Identity y Catalog ya proveen valores
 * reales; el resto queda marcado `available: false` hasta que existan los
 * módulos de Pedidos e Inventario — así el frontend no cambia de forma
 * cuando esos módulos empiecen a llenar los valores reales.
 */
@Injectable()
export class GetDashboardMetricsUseCase {
  constructor(
    private readonly getUserStatsUseCase: GetUserStatsUseCase,
    private readonly getProductStatsUseCase: GetProductStatsUseCase,
  ) {}

  async execute(): Promise<DashboardMetrics> {
    const [userStats, productStats] = await Promise.all([
      this.getUserStatsUseCase.execute(),
      this.getProductStatsUseCase.execute(),
    ]);

    return {
      customers: { value: userStats.totalCustomers, available: true },
      staff: { value: userStats.totalStaff, available: true },
      activeUsers: { value: userStats.totalActiveUsers, available: true },
      sales: { value: 0, available: false },
      orders: { value: 0, available: false },
      products: { value: productStats.total, available: true },
      revenue: { value: 0, available: false },
      conversionRate: { value: 0, available: false },
      inventoryAlerts: { value: 0, available: false },
    };
  }
}
