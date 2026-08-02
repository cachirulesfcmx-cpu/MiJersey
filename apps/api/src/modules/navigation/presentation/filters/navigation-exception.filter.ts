import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  InvalidNavigationItemError,
  NavigationDepthExceededError,
  NavigationError,
  NavigationMenuNotFoundError,
  NavigationTargetNotFoundError,
  NavigationVersionNotFoundError,
} from '../../domain/errors/navigation.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => NavigationError, number>([
  [NavigationMenuNotFoundError, HttpStatus.NOT_FOUND],
  [NavigationVersionNotFoundError, HttpStatus.NOT_FOUND],
  [InvalidNavigationItemError, HttpStatus.BAD_REQUEST],
  [NavigationDepthExceededError, HttpStatus.BAD_REQUEST],
  [NavigationTargetNotFoundError, HttpStatus.BAD_REQUEST],
]);

function deriveErrorCode(error: NavigationError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(NavigationError)
export class NavigationExceptionFilter implements ExceptionFilter {
  catch(exception: NavigationError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => NavigationError) ??
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
