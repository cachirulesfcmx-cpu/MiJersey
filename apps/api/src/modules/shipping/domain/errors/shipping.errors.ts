export class ShippingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class CarrierNotFoundError extends ShippingError {
  constructor() {
    super('Transportista no encontrado');
  }
}

export class CarrierCodeAlreadyExistsError extends ShippingError {
  constructor() {
    super('Ya existe un transportista con ese código');
  }
}

export class ShippingZoneNotFoundError extends ShippingError {
  constructor() {
    super('Zona de envío no encontrada');
  }
}

export class ShippingRateNotFoundError extends ShippingError {
  constructor() {
    super('Tarifa de envío no encontrada');
  }
}

export class ShipmentNotFoundError extends ShippingError {
  constructor() {
    super('Envío no encontrado');
  }
}

export class TrackingNumberNotFoundError extends ShippingError {
  constructor() {
    super('Número de guía no encontrado');
  }
}

/** Copia propia, no importada de Orders — mismo criterio que `payments.errors.ts`. */
export class OrderNotFoundError extends ShippingError {
  constructor() {
    super('Pedido no encontrado');
  }
}

export class OrderNotPayableForShipmentError extends ShippingError {
  constructor() {
    super('El pedido debe estar pagado antes de generar un envío');
  }
}

export class ShipmentAlreadyActiveError extends ShippingError {
  constructor() {
    super('El pedido ya tiene un envío activo');
  }
}

export class ShipmentNotUpdatableError extends ShippingError {
  constructor() {
    super('Este envío ya está en un estado final y no admite más actualizaciones');
  }
}

export class CartNotFoundError extends ShippingError {
  constructor() {
    super('Carrito no encontrado');
  }
}
