export class ReviewsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ReviewProductNotFoundError extends ReviewsError {
  constructor() {
    super('Producto no encontrado');
  }
}

export class ReviewNotFoundError extends ReviewsError {
  constructor() {
    super('Reseña no encontrada');
  }
}

export class InvalidRatingError extends ReviewsError {
  constructor() {
    super('La calificación debe ser un número entero entre 1 y 5');
  }
}
