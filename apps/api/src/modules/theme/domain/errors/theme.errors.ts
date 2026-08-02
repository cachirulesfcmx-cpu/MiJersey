export class ThemeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ThemeVersionNotFoundError extends ThemeError {
  constructor() {
    super('Versión del tema no encontrada');
  }
}

export class InvalidThemeSectionError extends ThemeError {
  constructor(message: string) {
    super(message);
  }
}
