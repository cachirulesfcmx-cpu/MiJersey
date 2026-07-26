export class TaxonomyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidSlugError extends TaxonomyError {
  constructor(raw: string) {
    super(`"${raw}" no es un slug válido (use minúsculas, números y guiones)`);
  }
}

export class CategoryNotFoundError extends TaxonomyError {
  constructor() {
    super('Categoría no encontrada');
  }
}

export class CategorySlugAlreadyExistsError extends TaxonomyError {
  constructor() {
    super('Ya existe una categoría con ese slug');
  }
}

export class CategoryCycleError extends TaxonomyError {
  constructor() {
    super('Una categoría no puede ser su propio ancestro');
  }
}

export class CategoryMaxDepthExceededError extends TaxonomyError {
  constructor() {
    super('Se alcanzó la profundidad máxima permitida en la jerarquía de categorías');
  }
}

export class CategoryHasChildrenError extends TaxonomyError {
  constructor() {
    super('No se puede eliminar una categoría que tiene subcategorías');
  }
}

export class CollectionNotFoundError extends TaxonomyError {
  constructor() {
    super('Colección no encontrada');
  }
}

export class CollectionSlugAlreadyExistsError extends TaxonomyError {
  constructor() {
    super('Ya existe una colección con ese slug');
  }
}

export class InvalidCollectionOperationError extends TaxonomyError {
  constructor(message: string) {
    super(message);
  }
}

export class ProductNotFoundError extends TaxonomyError {
  constructor() {
    super('Producto no encontrado');
  }
}
