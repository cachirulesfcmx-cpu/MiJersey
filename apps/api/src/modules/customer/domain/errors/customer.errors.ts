export class CustomerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class AddressNotFoundError extends CustomerError {
  constructor() {
    super('Dirección no encontrada');
  }
}

export class OrderNotFoundError extends CustomerError {
  constructor() {
    super('Pedido no encontrado');
  }
}
