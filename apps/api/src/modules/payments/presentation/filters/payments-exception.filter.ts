import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  InvalidRefundAmountError,
  InvalidWebhookSignatureError,
  OrderNotFoundError,
  OrderNotPayableError,
  PaymentError,
  PaymentNotCapturableError,
  PaymentNotFoundError,
  PaymentNotRefundableError,
  RefundProcessingError,
  UnsupportedPaymentProviderError,
} from '../../domain/errors/payments.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => PaymentError, number>([
  [PaymentNotFoundError, HttpStatus.NOT_FOUND],
  [OrderNotFoundError, HttpStatus.NOT_FOUND],
  [OrderNotPayableError, HttpStatus.CONFLICT],
  [PaymentNotCapturableError, HttpStatus.CONFLICT],
  [PaymentNotRefundableError, HttpStatus.CONFLICT],
  [InvalidRefundAmountError, HttpStatus.UNPROCESSABLE_ENTITY],
  [RefundProcessingError, HttpStatus.BAD_GATEWAY],
  [InvalidWebhookSignatureError, HttpStatus.UNAUTHORIZED],
  [UnsupportedPaymentProviderError, HttpStatus.BAD_REQUEST],
]);

function deriveErrorCode(error: PaymentError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(PaymentError)
export class PaymentsExceptionFilter implements ExceptionFilter {
  catch(exception: PaymentError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => PaymentError) ??
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
