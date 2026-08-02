export class EmailTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class EmailTemplateNotFoundError extends EmailTemplateError {
  constructor() {
    super('Plantilla de correo no encontrada');
  }
}

export class EmailTemplateVersionNotFoundError extends EmailTemplateError {
  constructor() {
    super('Versión de la plantilla no encontrada');
  }
}

export class EmailLayoutNotFoundError extends EmailTemplateError {
  constructor() {
    super('Layout de correo no encontrado');
  }
}

export class DuplicateEmailTemplateKeyError extends EmailTemplateError {
  constructor() {
    super('Ya existe una plantilla con esa clave e idioma');
  }
}

export class InvalidEmailTemplateError extends EmailTemplateError {
  constructor(message: string) {
    super(message);
  }
}
