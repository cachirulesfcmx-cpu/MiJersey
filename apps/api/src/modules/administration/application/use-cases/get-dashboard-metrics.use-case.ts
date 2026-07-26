import { Injectable } from '@nestjs/common';

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
 * Contrato de métricas del dashboard. Los valores de Identity son reales;
 * el resto queda marcado `available: false` hasta que existan los módulos
 * de Catálogo, Pedidos e Inventario — así el frontend no cambia de forma
 * cuando esos módulos empiecen a llenar los valores reales.
 */
@Injectable()
export class GetDashboardMetricsUseCase {
  constructor(private readonly getUserStatsUseCase: GetUserStatsUseCase) {}

  async execute(): Promise<DashboardMetrics> {
    const stats = await this.getUserStatsUseCase.execute();

    return {
      customers: { value: stats.totalCustomers, available: true },
      staff: { value: stats.totalStaff, available: true },
      activeUsers: { value: stats.totalActiveUsers, available: true },
      sales: { value: 0, available: false },
      orders: { value: 0, available: false },
      products: { value: 0, available: false },
      revenue: { value: 0, available: false },
      conversionRate: { value: 0, available: false },
      inventoryAlerts: { value: 0, available: false },
    };
  }
}
