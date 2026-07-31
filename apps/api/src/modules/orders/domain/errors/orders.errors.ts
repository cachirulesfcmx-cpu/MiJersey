export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class OrderNotFoundError extends OrderError {
  constructor() {
    super('Pedido no encontrado');
  }
}

export class OrderNotCancellableError extends OrderError {
  constructor() {
    super('Este pedido ya no se puede cancelar');
  }
}
