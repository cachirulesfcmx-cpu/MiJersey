export class IdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidEmailError extends IdentityError {
  constructor(raw: string) {
    super(`"${raw}" no es un correo electrónico válido`);
  }
}

export class InvalidCredentialsError extends IdentityError {
  constructor() {
    super('Credenciales inválidas');
  }
}

export class EmailAlreadyRegisteredError extends IdentityError {
  constructor() {
    super('El correo electrónico ya está registrado');
  }
}

export class AccountInactiveError extends IdentityError {
  constructor() {
    super('La cuenta está inactiva');
  }
}

export class SessionNotFoundError extends IdentityError {
  constructor() {
    super('Sesión no encontrada o inválida');
  }
}

export class TokenExpiredError extends IdentityError {
  constructor() {
    super('El token ha expirado');
  }
}

export class TokenAlreadyUsedError extends IdentityError {
  constructor() {
    super('El token ya fue utilizado');
  }
}

export class TokenInvalidError extends IdentityError {
  constructor() {
    super('El token es inválido');
  }
}
