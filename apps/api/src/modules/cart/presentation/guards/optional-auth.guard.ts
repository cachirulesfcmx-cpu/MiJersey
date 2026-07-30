import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import type {
  AccessTokenPayload,
  TokenServicePort,
} from '../../../identity/domain/ports/token.service.port';
import { TOKEN_SERVICE } from '../../../identity/identity.constants';

/**
 * Variante de `JwtAuthGuard` para rutas de Cart: el carrito funciona para invitados y clientes por
 * igual, así que un token ausente no es un error — pero un token presente e inválido/expirado sí lo
 * sigue siendo (misma semántica que el guard global, solo que "sin token" ya no lanza).
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AccessTokenPayload }>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return true;
    }

    const token = authHeader.slice('Bearer '.length);
    try {
      request.user = this.tokens.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Token de acceso inválido o expirado');
    }

    return true;
  }
}
