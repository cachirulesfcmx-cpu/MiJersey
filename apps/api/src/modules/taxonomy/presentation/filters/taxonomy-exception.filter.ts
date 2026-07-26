import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  CategoryCycleError,
  CategoryHasChildrenError,
  CategoryMaxDepthExceededError,
  CategoryNotFoundError,
  CategorySlugAlreadyExistsError,
  CollectionNotFoundError,
  CollectionSlugAlreadyExistsError,
  InvalidCollectionOperationError,
  InvalidSlugError,
  ProductNotFoundError,
  TaxonomyError,
} from '../../domain/errors/taxonomy.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => TaxonomyError, number>([
  [InvalidSlugError, HttpStatus.BAD_REQUEST],
  [CategoryNotFoundError, HttpStatus.NOT_FOUND],
  [CategorySlugAlreadyExistsError, HttpStatus.CONFLICT],
  [CategoryCycleError, HttpStatus.BAD_REQUEST],
  [CategoryMaxDepthExceededError, HttpStatus.BAD_REQUEST],
  [CategoryHasChildrenError, HttpStatus.CONFLICT],
  [CollectionNotFoundError, HttpStatus.NOT_FOUND],
  [CollectionSlugAlreadyExistsError, HttpStatus.CONFLICT],
  [InvalidCollectionOperationError, HttpStatus.BAD_REQUEST],
  [ProductNotFoundError, HttpStatus.NOT_FOUND],
]);

function deriveErrorCode(error: TaxonomyError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

/** Traduce los errores del dominio Taxonomy al contrato uniforme de error de la API. */
@Catch(TaxonomyError)
export class TaxonomyExceptionFilter implements ExceptionFilter {
  catch(exception: TaxonomyError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => TaxonomyError) ??
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
