export class HomeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class HomeSectionNotFoundError extends HomeError {
  constructor() {
    super('Sección de Home no encontrada');
  }
}

export class InvalidHomeSectionConfigError extends HomeError {
  constructor(reason: string) {
    super(`Configuración de sección inválida: ${reason}`);
  }
}
