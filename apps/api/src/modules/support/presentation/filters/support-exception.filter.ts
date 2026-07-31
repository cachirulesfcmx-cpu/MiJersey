import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  OrderNotFoundError,
  RmaNotFoundError,
  SupportError,
  TicketClosedError,
  TicketNotFoundError,
} from '../../domain/errors/support.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => SupportError, number>([
  [TicketNotFoundError, HttpStatus.NOT_FOUND],
  [RmaNotFoundError, HttpStatus.NOT_FOUND],
  [OrderNotFoundError, HttpStatus.NOT_FOUND],
  [TicketClosedError, HttpStatus.CONFLICT],
]);

function deriveErrorCode(error: SupportError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(SupportError)
export class SupportExceptionFilter implements ExceptionFilter {
  catch(exception: SupportError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => SupportError) ??
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
