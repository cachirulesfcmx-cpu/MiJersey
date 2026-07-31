import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  CarrierCodeAlreadyExistsError,
  CarrierNotFoundError,
  CartNotFoundError,
  OrderNotFoundError,
  OrderNotPayableForShipmentError,
  ShipmentAlreadyActiveError,
  ShipmentNotFoundError,
  ShipmentNotUpdatableError,
  ShippingError,
  ShippingRateNotFoundError,
  ShippingZoneNotFoundError,
  TrackingNumberNotFoundError,
} from '../../domain/errors/shipping.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => ShippingError, number>([
  [CarrierNotFoundError, HttpStatus.NOT_FOUND],
  [ShippingZoneNotFoundError, HttpStatus.NOT_FOUND],
  [ShippingRateNotFoundError, HttpStatus.NOT_FOUND],
  [ShipmentNotFoundError, HttpStatus.NOT_FOUND],
  [TrackingNumberNotFoundError, HttpStatus.NOT_FOUND],
  [OrderNotFoundError, HttpStatus.NOT_FOUND],
  [CartNotFoundError, HttpStatus.NOT_FOUND],
  [CarrierCodeAlreadyExistsError, HttpStatus.CONFLICT],
  [OrderNotPayableForShipmentError, HttpStatus.CONFLICT],
  [ShipmentAlreadyActiveError, HttpStatus.CONFLICT],
  [ShipmentNotUpdatableError, HttpStatus.CONFLICT],
]);

function deriveErrorCode(error: ShippingError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(ShippingError)
export class ShippingExceptionFilter implements ExceptionFilter {
  catch(exception: ShippingError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => ShippingError) ??
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
