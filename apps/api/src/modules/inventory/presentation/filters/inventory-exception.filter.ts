import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  InsufficientStockError,
  InvalidMovementTypeError,
  InvalidReleaseQuantityError,
  InventoryConcurrencyError,
  InventoryError,
  InventoryItemNotFoundError,
  VariantNotFoundError,
  WarehouseCodeAlreadyExistsError,
  WarehouseNotActiveError,
  WarehouseNotFoundError,
} from '../../domain/errors/inventory.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => InventoryError, number>([
  [WarehouseNotFoundError, HttpStatus.NOT_FOUND],
  [WarehouseCodeAlreadyExistsError, HttpStatus.CONFLICT],
  [WarehouseNotActiveError, HttpStatus.CONFLICT],
  [VariantNotFoundError, HttpStatus.NOT_FOUND],
  [InventoryItemNotFoundError, HttpStatus.NOT_FOUND],
  [InsufficientStockError, HttpStatus.CONFLICT],
  [InvalidReleaseQuantityError, HttpStatus.CONFLICT],
  [InvalidMovementTypeError, HttpStatus.BAD_REQUEST],
  [InventoryConcurrencyError, HttpStatus.CONFLICT],
]);

function deriveErrorCode(error: InventoryError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

/** Traduce los errores del dominio Inventory al contrato uniforme de error de la API. */
@Catch(InventoryError)
export class InventoryExceptionFilter implements ExceptionFilter {
  catch(exception: InventoryError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => InventoryError) ??
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
