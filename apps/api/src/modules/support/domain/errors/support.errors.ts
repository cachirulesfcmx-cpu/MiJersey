export class SupportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class TicketNotFoundError extends SupportError {
  constructor() {
    super('Ticket no encontrado');
  }
}

export class RmaNotFoundError extends SupportError {
  constructor() {
    super('Solicitud de devolución no encontrada');
  }
}

export class TicketClosedError extends SupportError {
  constructor() {
    super('El ticket ya está cerrado y no admite nuevas respuestas');
  }
}

/** Copia propia, no importada de Orders — mismo criterio que `payments.errors.ts`/`shipping.errors.ts`. */
export class OrderNotFoundError extends SupportError {
  constructor() {
    super('Pedido no encontrado');
  }
}
