export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class CheckoutSessionNotFoundError extends CheckoutError {
  constructor() {
    super('Sesión de checkout no encontrada');
  }
}

export class CartEmptyError extends CheckoutError {
  constructor() {
    super('El carrito está vacío');
  }
}

export class ShippingMethodNotFoundError extends CheckoutError {
  constructor() {
    super('Método de envío no encontrado');
  }
}

export class ShippingMethodInactiveError extends CheckoutError {
  constructor() {
    super('El método de envío no está disponible');
  }
}

export class ShippingAddressRequiredError extends CheckoutError {
  constructor() {
    super('Falta capturar la dirección de envío');
  }
}

export class ShippingMethodRequiredError extends CheckoutError {
  constructor() {
    super('Falta seleccionar un método de envío');
  }
}

export class ContactEmailRequiredError extends CheckoutError {
  constructor() {
    super('Falta un correo de contacto');
  }
}

export class CartItemsUnavailableError extends CheckoutError {
  constructor(skus: string[]) {
    super(
      `Algunos artículos ya no están disponibles en la cantidad solicitada: ${skus.join(', ')}`,
    );
  }
}

export class CheckoutAlreadyConfirmedError extends CheckoutError {
  constructor() {
    super('Este checkout ya fue confirmado');
  }
}
