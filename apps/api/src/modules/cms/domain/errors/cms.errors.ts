export class CmsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PageNotFoundError extends CmsError {
  constructor() {
    super('Página no encontrada');
  }
}

export class PageSlugAlreadyExistsError extends CmsError {
  constructor() {
    super('Ya existe una página con ese slug');
  }
}

export class InvalidPageBlockError extends CmsError {
  constructor(message: string) {
    super(message);
  }
}

export class PageVersionNotFoundError extends CmsError {
  constructor() {
    super('Versión de la página no encontrada');
  }
}
