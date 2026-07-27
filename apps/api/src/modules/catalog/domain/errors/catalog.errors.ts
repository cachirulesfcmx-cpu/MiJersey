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

export class ProductOptionNotFoundError extends CatalogError {
  constructor() {
    super('Opción de producto no encontrada');
  }
}

export class DuplicateOptionNameError extends CatalogError {
  constructor() {
    super('Ya existe una opción con ese nombre en este producto');
  }
}

export class DuplicateOptionValueError extends CatalogError {
  constructor() {
    super('Ya existe ese valor en la opción');
  }
}

export class OptionValueInUseError extends CatalogError {
  constructor() {
    super('No se puede quitar un valor que usa alguna variante existente');
  }
}

export class ProductHasVariantsError extends CatalogError {
  constructor() {
    super('El producto tiene variantes; elimínalas antes de modificar sus opciones');
  }
}

export class ProductVariantNotFoundError extends CatalogError {
  constructor() {
    super('Variante no encontrada');
  }
}

export class VariantSkuAlreadyExistsError extends CatalogError {
  constructor() {
    super('Ya existe una variante con ese SKU');
  }
}

export class VariantSlugAlreadyExistsError extends CatalogError {
  constructor() {
    super('Ya existe una variante con ese slug');
  }
}

export class DuplicateVariantCombinationError extends CatalogError {
  constructor() {
    super('Ya existe una variante con esa combinación de opciones');
  }
}

export class InvalidVariantOptionValuesError extends CatalogError {
  constructor() {
    super('Debe indicarse exactamente un valor por cada opción del producto');
  }
}
