import type { RoleName } from '../value-objects/role-name';

export interface AccessTokenPayload {
  sub: string;
  role: RoleName;
  sid: string;
}

export interface TokenServicePort {
  signAccessToken(payload: AccessTokenPayload): string;
  verifyAccessToken(token: string): AccessTokenPayload;
  generateOpaqueToken(): string;
  hashOpaqueToken(token: string): string;
}
