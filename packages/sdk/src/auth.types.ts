export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'SUPPORT' | 'CUSTOMER';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleName;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthSession {
  user: UserProfile;
  accessToken: string;
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
