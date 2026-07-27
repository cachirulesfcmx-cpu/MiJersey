export class AttributeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidAttributeCodeError extends AttributeError {
  constructor(raw: string) {
    super(`"${raw}" no es un código válido (use minúsculas, números y guiones bajos)`);
  }
}

export class AttributeNotFoundError extends AttributeError {
  constructor() {
    super('Atributo no encontrado');
  }
}

export class AttributeCodeAlreadyExistsError extends AttributeError {
  constructor() {
    super('Ya existe un atributo con ese código');
  }
}

export class AttributeInUseError extends AttributeError {
  constructor() {
    super('No se puede cambiar el tipo de un atributo que ya está asignado a productos');
  }
}

export class AttributeValueNotFoundError extends AttributeError {
  constructor() {
    super('Valor de atributo no encontrado');
  }
}

export class DuplicateAttributeValueError extends AttributeError {
  constructor() {
    super('Ya existe ese valor dentro del atributo');
  }
}

export class AttributeValueInUseError extends AttributeError {
  constructor() {
    super('No se puede eliminar un valor que está asignado a productos');
  }
}

export class InvalidAttributeAssignmentError extends AttributeError {
  constructor(message: string) {
    super(message);
  }
}

export class ProductNotFoundError extends AttributeError {
  constructor() {
    super('Producto no encontrado');
  }
}

export class InvalidFilterQueryError extends AttributeError {
  constructor() {
    super('El parámetro "filters" no tiene un formato válido');
  }
}
