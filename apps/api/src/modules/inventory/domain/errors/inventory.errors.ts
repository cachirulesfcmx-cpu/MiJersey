export class InventoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class WarehouseNotFoundError extends InventoryError {
  constructor() {
    super('Almacén no encontrado');
  }
}

export class WarehouseCodeAlreadyExistsError extends InventoryError {
  constructor() {
    super('Ya existe un almacén con ese código');
  }
}

export class WarehouseNotActiveError extends InventoryError {
  constructor() {
    super('El almacén está archivado y no admite nuevos movimientos');
  }
}

export class VariantNotFoundError extends InventoryError {
  constructor() {
    super('Variante no encontrada');
  }
}

export class InventoryItemNotFoundError extends InventoryError {
  constructor() {
    super('No existe inventario para esa variante en ese almacén');
  }
}

export class InsufficientStockError extends InventoryError {
  constructor() {
    super('Stock disponible insuficiente para esta operación');
  }
}

export class InvalidReleaseQuantityError extends InventoryError {
  constructor() {
    super('No se puede liberar más cantidad de la reservada');
  }
}

export class InvalidMovementTypeError extends InventoryError {
  constructor() {
    super('Este tipo de movimiento no se puede registrar mediante un ajuste manual');
  }
}

export class InventoryConcurrencyError extends InventoryError {
  constructor() {
    super('El inventario fue modificado por otra operación; reintenta la solicitud');
  }
}
