export class BlogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PostNotFoundError extends BlogError {
  constructor() {
    super('Artículo no encontrado');
  }
}

export class PostSlugAlreadyExistsError extends BlogError {
  constructor() {
    super('Ya existe un artículo con ese slug');
  }
}

export class PostVersionNotFoundError extends BlogError {
  constructor() {
    super('Versión del artículo no encontrada');
  }
}

export class BlogCategoryNotFoundError extends BlogError {
  constructor() {
    super('Categoría de blog no encontrada');
  }
}

export class BlogCategorySlugAlreadyExistsError extends BlogError {
  constructor() {
    super('Ya existe una categoría de blog con ese slug');
  }
}

export class BlogTagNotFoundError extends BlogError {
  constructor() {
    super('Etiqueta de blog no encontrada');
  }
}

export class BlogTagSlugAlreadyExistsError extends BlogError {
  constructor() {
    super('Ya existe una etiqueta de blog con ese slug');
  }
}
