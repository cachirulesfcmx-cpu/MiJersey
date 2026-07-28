export class SeoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class SeoEntityNotFoundError extends SeoError {
  constructor() {
    super('La entidad indicada no existe');
  }
}

export class RedirectNotFoundError extends SeoError {
  constructor() {
    super('Redirección no encontrada');
  }
}

export class RedirectFromPathAlreadyExistsError extends SeoError {
  constructor() {
    super('Ya existe una redirección para esa ruta de origen');
  }
}

export class RedirectLoopError extends SeoError {
  constructor() {
    super('La ruta de origen y destino no pueden ser la misma');
  }
}
