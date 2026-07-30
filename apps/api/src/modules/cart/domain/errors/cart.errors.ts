export class CartError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class CartNotFoundError extends CartError {
  constructor() {
    super('Carrito no encontrado');
  }
}

export class CartItemNotFoundError extends CartError {
  constructor() {
    super('Artículo no encontrado en el carrito');
  }
}

export class InvalidQuantityError extends CartError {
  constructor() {
    super('La cantidad debe ser un entero mayor a cero');
  }
}

export class ProductNotAvailableError extends CartError {
  constructor() {
    super('El producto no está disponible');
  }
}

export class InsufficientInventoryError extends CartError {
  constructor(available: number) {
    super(`Solo hay ${available} unidades disponibles`);
  }
}

export class CouponNotFoundError extends CartError {
  constructor() {
    super('Cupón no encontrado');
  }
}

export class CouponAlreadyExistsError extends CartError {
  constructor() {
    super('Ya existe un cupón con ese código');
  }
}

export class CouponInactiveError extends CartError {
  constructor() {
    super('El cupón no está activo');
  }
}

export class CouponExpiredError extends CartError {
  constructor() {
    super('El cupón ha expirado');
  }
}

export class NoCouponAppliedError extends CartError {
  constructor() {
    super('El carrito no tiene un cupón aplicado');
  }
}
