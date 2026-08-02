export class AnalyticsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AnalyticsDashboardNotFoundError extends AnalyticsError {
  constructor() {
    super('Dashboard de analítica no encontrado');
  }
}

export class InvalidAnalyticsQueryError extends AnalyticsError {
  constructor(message: string) {
    super(message);
  }
}
