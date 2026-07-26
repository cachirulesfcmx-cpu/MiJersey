export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');
export const PASSWORD_RESET_REPOSITORY = Symbol('PASSWORD_RESET_REPOSITORY');
export const EMAIL_VERIFICATION_REPOSITORY = Symbol('EMAIL_VERIFICATION_REPOSITORY');
export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
export const MAILER = Symbol('MAILER');

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_DAYS = 30;
export const PASSWORD_RESET_TTL_HOURS = 1;
export const EMAIL_VERIFICATION_TTL_HOURS = 24;
export const BCRYPT_SALT_ROUNDS = 12;
export const REFRESH_TOKEN_COOKIE_NAME = 'mijersey_refresh_token';

/**
 * Hash bcrypt de un valor arbitrario, usado únicamente para comparar contra
 * él cuando no existe un usuario con el email dado. Evita que el tiempo de
 * respuesta de /auth/login revele si un correo está registrado.
 */
export const DUMMY_PASSWORD_HASH = '$2a$12$vVZhImzCMOBa6FGO.G/BH.0EI0RwHkesHo3ksh7l58G0wKFas/iUG';
