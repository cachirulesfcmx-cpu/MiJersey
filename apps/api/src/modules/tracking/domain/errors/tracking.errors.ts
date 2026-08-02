export class TrackingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class TrackingProviderNotFoundError extends TrackingError {
  constructor() {
    super('Proveedor de tracking no encontrado');
  }
}

export class DuplicateTrackingProviderError extends TrackingError {
  constructor() {
    super('Ya existe una configuración para este proveedor');
  }
}

export class InvalidTrackingConfigurationError extends TrackingError {
  constructor(missingFields: string[]) {
    super(`Configuración inválida: faltan los campos ${missingFields.join(', ')}`);
  }
}
