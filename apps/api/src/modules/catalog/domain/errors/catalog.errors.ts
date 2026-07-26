export class CatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidSkuError extends CatalogError {
  constructor(raw: string) {
    super(`"${raw}" no es un SKU válido (use letras, números y guiones, 3-64 caracteres)`);
  }
}

export class InvalidSlugError extends CatalogError {
  constructor(raw: string) {
    super(`"${raw}" no es un slug válido (use minúsculas, números y guiones)`);
  }
}

export class SkuAlreadyExistsError extends CatalogError {
  constructor() {
    super('Ya existe un producto con ese SKU');
  }
}

export class SlugAlreadyExistsError extends CatalogError {
  constructor() {
    super('Ya existe un producto con ese slug');
  }
}

export class ProductNotFoundError extends CatalogError {
  constructor() {
    super('Producto no encontrado');
  }
}
