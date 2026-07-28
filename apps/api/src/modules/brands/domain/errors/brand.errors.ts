export class BrandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BrandNotFoundError extends BrandError {
  constructor() {
    super('Marca no encontrada');
  }
}

export class BrandSlugAlreadyExistsError extends BrandError {
  constructor() {
    super('Ya existe una marca con ese slug');
  }
}

export class BrandNameAlreadyExistsError extends BrandError {
  constructor() {
    super('Ya existe una marca con ese nombre');
  }
}

export class BrandHasProductsError extends BrandError {
  constructor() {
    super('No se puede eliminar una marca con productos asociados sin confirmar la acción');
  }
}

export class ProductNotFoundError extends BrandError {
  constructor() {
    super('Producto no encontrado');
  }
}

export class InvalidSlugError extends BrandError {
  constructor(raw: string) {
    super(`Slug inválido: ${raw}`);
  }
}
