export class NavigationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NavigationMenuNotFoundError extends NavigationError {
  constructor() {
    super('Menú de navegación no encontrado');
  }
}

export class NavigationVersionNotFoundError extends NavigationError {
  constructor() {
    super('Versión del menú no encontrada');
  }
}

export class InvalidNavigationItemError extends NavigationError {
  constructor(message: string) {
    super(message);
  }
}

export class NavigationDepthExceededError extends NavigationError {
  constructor(maxDepth: number) {
    super(`El árbol de navegación no puede superar ${maxDepth} niveles de profundidad`);
  }
}

export class NavigationTargetNotFoundError extends NavigationError {
  constructor(label: string) {
    super(`El recurso enlazado por "${label}" no existe`);
  }
}
