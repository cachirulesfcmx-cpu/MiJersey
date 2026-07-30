import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  CartError,
  CartItemNotFoundError,
  CartNotFoundError,
  CouponAlreadyExistsError,
  CouponExpiredError,
  CouponInactiveError,
  CouponNotFoundError,
  InsufficientInventoryError,
  InvalidQuantityError,
  NoCouponAppliedError,
  ProductNotAvailableError,
} from '../../domain/errors/cart.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => CartError, number>([
  [CartNotFoundError, HttpStatus.NOT_FOUND],
  [CartItemNotFoundError, HttpStatus.NOT_FOUND],
  [CouponNotFoundError, HttpStatus.NOT_FOUND],
  [CouponAlreadyExistsError, HttpStatus.CONFLICT],
  [CouponInactiveError, HttpStatus.CONFLICT],
  [CouponExpiredError, HttpStatus.CONFLICT],
  [NoCouponAppliedError, HttpStatus.CONFLICT],
  [InvalidQuantityError, HttpStatus.BAD_REQUEST],
  [ProductNotAvailableError, HttpStatus.UNPROCESSABLE_ENTITY],
  [InsufficientInventoryError, HttpStatus.UNPROCESSABLE_ENTITY],
]);

function deriveErrorCode(error: CartError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(CartError)
export class CartExceptionFilter implements ExceptionFilter {
  catch(exception: CartError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => CartError) ??
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
