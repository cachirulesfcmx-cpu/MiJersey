/**
 * Desafío MFA de un solo uso entre "contraseña validada" y "sesión emitida" —
 * vive solo en Redis con TTL corto (ver MFA_CHALLENGE_TTL_SECONDS), nunca en
 * Postgres: es un estado transitorio de un login en curso, no un registro que
 * deba sobrevivir un reinicio ni auditarse por sí mismo.
 */
export interface MfaChallengeStorePort {
  /** Crea un token opaco de un solo uso asociado a `userId` y lo devuelve. */
  create(userId: string): Promise<string>;
  /**
   * Lee el `userId` asociado sin invalidar el desafío — un código TOTP
   * incorrecto no debe obligar a repetir el login completo; el usuario puede
   * reintentar mientras el desafío siga vigente (ver `invalidate`).
   */
  peek(challengeToken: string): Promise<string | null>;
  /** Invalida el desafío tras una verificación exitosa (uso único real). */
  invalidate(challengeToken: string): Promise<void>;
}
