import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  RedirectFromPathAlreadyExistsError,
  RedirectLoopError,
  RedirectNotFoundError,
  SeoEntityNotFoundError,
  SeoError,
} from '../../domain/errors/seo.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => SeoError, number>([
  [SeoEntityNotFoundError, HttpStatus.NOT_FOUND],
  [RedirectNotFoundError, HttpStatus.NOT_FOUND],
  [RedirectFromPathAlreadyExistsError, HttpStatus.CONFLICT],
  [RedirectLoopError, HttpStatus.BAD_REQUEST],
]);

function deriveErrorCode(error: SeoError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

/** Traduce los errores del dominio SEO al contrato uniforme de error de la API. */
@Catch(SeoError)
export class SeoExceptionFilter implements ExceptionFilter {
  catch(exception: SeoError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => SeoError) ??
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
