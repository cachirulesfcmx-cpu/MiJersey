import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  CartEmptyError,
  CartItemsUnavailableError,
  CheckoutAlreadyConfirmedError,
  CheckoutError,
  CheckoutSessionNotFoundError,
  ContactEmailRequiredError,
  ShippingAddressRequiredError,
  ShippingMethodInactiveError,
  ShippingMethodNotFoundError,
  ShippingMethodRequiredError,
} from '../../domain/errors/checkout.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => CheckoutError, number>([
  [CheckoutSessionNotFoundError, HttpStatus.NOT_FOUND],
  [ShippingMethodNotFoundError, HttpStatus.NOT_FOUND],
  [CartEmptyError, HttpStatus.UNPROCESSABLE_ENTITY],
  [ShippingMethodInactiveError, HttpStatus.CONFLICT],
  [ShippingAddressRequiredError, HttpStatus.UNPROCESSABLE_ENTITY],
  [ShippingMethodRequiredError, HttpStatus.UNPROCESSABLE_ENTITY],
  [ContactEmailRequiredError, HttpStatus.UNPROCESSABLE_ENTITY],
  [CartItemsUnavailableError, HttpStatus.CONFLICT],
  [CheckoutAlreadyConfirmedError, HttpStatus.CONFLICT],
]);

function deriveErrorCode(error: CheckoutError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(CheckoutError)
export class CheckoutExceptionFilter implements ExceptionFilter {
  catch(exception: CheckoutError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => CheckoutError) ??
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
