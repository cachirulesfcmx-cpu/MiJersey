import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  CatalogError,
  DuplicateOptionNameError,
  DuplicateOptionValueError,
  DuplicateVariantCombinationError,
  InvalidSkuError,
  InvalidSlugError,
  InvalidVariantOptionValuesError,
  OptionValueInUseError,
  ProductHasVariantsError,
  ProductNotFoundError,
  ProductOptionNotFoundError,
  ProductVariantNotFoundError,
  SkuAlreadyExistsError,
  SlugAlreadyExistsError,
  VariantSkuAlreadyExistsError,
  VariantSlugAlreadyExistsError,
} from '../../domain/errors/catalog.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => CatalogError, number>([
  [InvalidSkuError, HttpStatus.BAD_REQUEST],
  [InvalidSlugError, HttpStatus.BAD_REQUEST],
  [SkuAlreadyExistsError, HttpStatus.CONFLICT],
  [SlugAlreadyExistsError, HttpStatus.CONFLICT],
  [ProductNotFoundError, HttpStatus.NOT_FOUND],
  [ProductOptionNotFoundError, HttpStatus.NOT_FOUND],
  [DuplicateOptionNameError, HttpStatus.CONFLICT],
  [DuplicateOptionValueError, HttpStatus.CONFLICT],
  [OptionValueInUseError, HttpStatus.CONFLICT],
  [ProductHasVariantsError, HttpStatus.CONFLICT],
  [ProductVariantNotFoundError, HttpStatus.NOT_FOUND],
  [VariantSkuAlreadyExistsError, HttpStatus.CONFLICT],
  [VariantSlugAlreadyExistsError, HttpStatus.CONFLICT],
  [DuplicateVariantCombinationError, HttpStatus.CONFLICT],
  [InvalidVariantOptionValuesError, HttpStatus.BAD_REQUEST],
]);

function deriveErrorCode(error: CatalogError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

/** Traduce los errores del dominio Catalog al contrato uniforme de error de la API. */
@Catch(CatalogError)
export class CatalogExceptionFilter implements ExceptionFilter {
  catch(exception: CatalogError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => CatalogError) ??
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
