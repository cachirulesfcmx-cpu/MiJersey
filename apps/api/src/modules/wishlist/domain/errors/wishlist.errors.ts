export class WishlistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class WishlistItemNotFoundError extends WishlistError {
  constructor() {
    super('Artículo no encontrado en la lista de deseos');
  }
}

export class DuplicateWishlistItemError extends WishlistError {
  constructor() {
    super('Esta variante ya está en tu lista de deseos');
  }
}

export class ProductNotFoundError extends WishlistError {
  constructor() {
    super('Producto o variante no encontrado');
  }
}

export class SharedWishlistNotFoundError extends WishlistError {
  constructor() {
    super('Enlace de lista de deseos no encontrado');
  }
}
