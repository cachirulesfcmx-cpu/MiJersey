import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  MaxRetriesExceededError,
  NotificationError,
  NotificationNotFailedError,
  NotificationNotFoundError,
} from '../../domain/errors/notifications.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => NotificationError, number>([
  [NotificationNotFoundError, HttpStatus.NOT_FOUND],
  [NotificationNotFailedError, HttpStatus.CONFLICT],
  [MaxRetriesExceededError, HttpStatus.CONFLICT],
]);

function deriveErrorCode(error: NotificationError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(NotificationError)
export class NotificationsExceptionFilter implements ExceptionFilter {
  catch(exception: NotificationError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => NotificationError) ??
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
