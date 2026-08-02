export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'SUPPORT' | 'CUSTOMER';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleName;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface AuthenticatedUser extends UserProfile {
  permissions: string[];
}

export interface AuthSession {
  mfaRequired: false;
  user: AuthenticatedUser;
  accessToken: string;
}

/** `POST /auth/login` responde esto en vez de una sesión cuando el usuario tiene MFA activo (035) — completar con `verifyMfaChallenge`. */
export interface MfaChallenge {
  mfaRequired: true;
  challengeToken: string;
}

export type LoginResult = AuthSession | MfaChallenge;

export interface VerifyMfaChallengeInput {
  challengeToken: string;
  code: string;
}

export interface EnrollMfaResult {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface MfaCodeInput {
  code: string;
}

export interface SessionSummary {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}
