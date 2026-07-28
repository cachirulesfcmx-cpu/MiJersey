import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  BrandError,
  BrandHasProductsError,
  BrandNameAlreadyExistsError,
  BrandNotFoundError,
  BrandSlugAlreadyExistsError,
  InvalidSlugError,
  ProductNotFoundError,
} from '../../domain/errors/brand.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => BrandError, number>([
  [BrandNotFoundError, HttpStatus.NOT_FOUND],
  [BrandSlugAlreadyExistsError, HttpStatus.CONFLICT],
  [BrandNameAlreadyExistsError, HttpStatus.CONFLICT],
  [BrandHasProductsError, HttpStatus.CONFLICT],
  [ProductNotFoundError, HttpStatus.NOT_FOUND],
  [InvalidSlugError, HttpStatus.BAD_REQUEST],
]);

function deriveErrorCode(error: BrandError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

/** Traduce los errores del dominio Brand al contrato uniforme de error de la API. */
@Catch(BrandError)
export class BrandExceptionFilter implements ExceptionFilter {
  catch(exception: BrandError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => BrandError) ??
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
