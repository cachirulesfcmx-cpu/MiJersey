export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class PaymentNotFoundError extends PaymentError {
  constructor() {
    super('Pago no encontrado');
  }
}

/** Copia propia, no importada de Orders — Payments valida esto sin conocer el resto del dominio de pedidos, solo lee `status` a través de `ORDER_REPOSITORY`. */
export class OrderNotFoundError extends PaymentError {
  constructor() {
    super('Pedido no encontrado');
  }
}

export class OrderNotPayableError extends PaymentError {
  constructor() {
    super('Este pedido ya no admite un pago (cancelado o reembolsado)');
  }
}

export class PaymentNotCapturableError extends PaymentError {
  constructor() {
    super('Este pago no está autorizado; no se puede capturar');
  }
}

export class PaymentNotRefundableError extends PaymentError {
  constructor() {
    super('Este pago no admite reembolso en su estado actual');
  }
}

export class InvalidRefundAmountError extends PaymentError {
  constructor() {
    super('El monto del reembolso excede lo capturado');
  }
}

export class RefundProcessingError extends PaymentError {
  constructor() {
    super('El proveedor de pago no pudo procesar el reembolso');
  }
}

export class InvalidWebhookSignatureError extends PaymentError {
  constructor() {
    super('Firma de webhook inválida');
  }
}

export class UnsupportedPaymentProviderError extends PaymentError {
  constructor(provider: string) {
    super(`Proveedor de pago no soportado: ${provider}`);
  }
}
