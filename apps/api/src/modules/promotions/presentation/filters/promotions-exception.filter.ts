import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  CartNotFoundError,
  InvalidPromotionCodeError,
  OrderNotFoundError,
  PromotionCodeAlreadyExistsError,
  PromotionError,
  PromotionNotEligibleError,
  PromotionNotFoundError,
} from '../../domain/errors/promotions.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => PromotionError, number>([
  [PromotionNotFoundError, HttpStatus.NOT_FOUND],
  [InvalidPromotionCodeError, HttpStatus.NOT_FOUND],
  [CartNotFoundError, HttpStatus.NOT_FOUND],
  [OrderNotFoundError, HttpStatus.NOT_FOUND],
  [PromotionCodeAlreadyExistsError, HttpStatus.CONFLICT],
  [PromotionNotEligibleError, HttpStatus.CONFLICT],
]);

function deriveErrorCode(error: PromotionError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(PromotionError)
export class PromotionsExceptionFilter implements ExceptionFilter {
  catch(exception: PromotionError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => PromotionError) ??
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
