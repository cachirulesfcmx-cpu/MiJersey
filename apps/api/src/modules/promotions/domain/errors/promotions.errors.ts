export class PromotionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PromotionNotFoundError extends PromotionError {
  constructor() {
    super('Promoción no encontrada');
  }
}

export class PromotionCodeAlreadyExistsError extends PromotionError {
  constructor() {
    super('Ya existe una promoción con ese código');
  }
}

export class InvalidPromotionCodeError extends PromotionError {
  constructor() {
    super('Código de promoción inválido');
  }
}

export class PromotionNotEligibleError extends PromotionError {
  constructor() {
    super('El carrito no cumple las condiciones de esta promoción');
  }
}

export class CartNotFoundError extends PromotionError {
  constructor() {
    super('Carrito no encontrado');
  }
}

/** Copia propia, no importada de Orders — mismo criterio que `shipping.errors.ts`/`payments.errors.ts`. */
export class OrderNotFoundError extends PromotionError {
  constructor() {
    super('Pedido no encontrado');
  }
}
