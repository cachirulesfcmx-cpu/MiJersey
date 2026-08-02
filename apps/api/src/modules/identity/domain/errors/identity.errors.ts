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

export class UserNotFoundError extends IdentityError {
  constructor() {
    super('Usuario no encontrado');
  }
}

export class CannotModifySelfError extends IdentityError {
  constructor() {
    super('No puedes modificar tu propia cuenta desde este panel');
  }
}

export class MfaNotApplicableError extends IdentityError {
  constructor() {
    super('La autenticación de dos factores solo aplica a personal interno');
  }
}

export class MfaNotEnrolledError extends IdentityError {
  constructor() {
    super('No hay un enrolamiento de MFA pendiente para confirmar');
  }
}

export class MfaAlreadyEnabledError extends IdentityError {
  constructor() {
    super('La autenticación de dos factores ya está activada');
  }
}

export class MfaNotEnabledError extends IdentityError {
  constructor() {
    super('La autenticación de dos factores no está activada');
  }
}

export class InvalidMfaCodeError extends IdentityError {
  constructor() {
    super('El código de verificación es inválido o expiró');
  }
}

export class MfaChallengeInvalidError extends IdentityError {
  constructor() {
    super('El desafío de MFA es inválido o expiró; inicia sesión de nuevo');
  }
}
