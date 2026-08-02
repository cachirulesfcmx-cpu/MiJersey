export class NotificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotificationNotFoundError extends NotificationError {
  constructor() {
    super('Notificación no encontrada');
  }
}

export class NotificationNotFailedError extends NotificationError {
  constructor() {
    super('Solo se pueden reintentar notificaciones con estado FAILED');
  }
}

export class MaxRetriesExceededError extends NotificationError {
  constructor() {
    super('Se alcanzó el máximo de reintentos permitidos');
  }
}
