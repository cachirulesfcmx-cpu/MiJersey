export class SearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class SearchSynonymNotFoundError extends SearchError {
  constructor() {
    super('Grupo de sinónimos no encontrado');
  }
}

export class SearchSynonymAlreadyExistsError extends SearchError {
  constructor() {
    super('Ya existe un grupo de sinónimos para ese término');
  }
}
