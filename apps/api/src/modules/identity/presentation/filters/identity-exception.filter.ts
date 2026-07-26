import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  AccountInactiveError,
  CannotModifySelfError,
  EmailAlreadyRegisteredError,
  IdentityError,
  InvalidCredentialsError,
  InvalidEmailError,
  SessionNotFoundError,
  TokenAlreadyUsedError,
  TokenExpiredError,
  TokenInvalidError,
  UserNotFoundError,
} from '../../domain/errors/identity.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => IdentityError, number>([
  [InvalidCredentialsError, HttpStatus.UNAUTHORIZED],
  [SessionNotFoundError, HttpStatus.UNAUTHORIZED],
  [AccountInactiveError, HttpStatus.FORBIDDEN],
  [EmailAlreadyRegisteredError, HttpStatus.CONFLICT],
  [InvalidEmailError, HttpStatus.BAD_REQUEST],
  [TokenExpiredError, HttpStatus.BAD_REQUEST],
  [TokenAlreadyUsedError, HttpStatus.BAD_REQUEST],
  [TokenInvalidError, HttpStatus.BAD_REQUEST],
  [UserNotFoundError, HttpStatus.NOT_FOUND],
  [CannotModifySelfError, HttpStatus.FORBIDDEN],
]);

function deriveErrorCode(error: IdentityError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

/** Traduce los errores del dominio Identity al contrato uniforme de error de la API. */
@Catch(IdentityError)
export class IdentityExceptionFilter implements ExceptionFilter {
  catch(exception: IdentityError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => IdentityError) ??
      HttpStatus.BAD_REQUEST;
    const requestId = request.id ?? request.headers['x-request-id']?.toString() ?? 'unknown';

    const body: ApiErrorResponse = {
      error: {
        code: deriveErrorCode(exception),
        message: exception.message,
        requestId,
      },
    };

    response.status(status).json(body);
  }
}
