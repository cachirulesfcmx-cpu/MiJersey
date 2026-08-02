import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  InvalidThemeSectionError,
  ThemeError,
  ThemeVersionNotFoundError,
} from '../../domain/errors/theme.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => ThemeError, number>([
  [ThemeVersionNotFoundError, HttpStatus.NOT_FOUND],
  [InvalidThemeSectionError, HttpStatus.BAD_REQUEST],
]);

function deriveErrorCode(error: ThemeError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(ThemeError)
export class ThemeExceptionFilter implements ExceptionFilter {
  catch(exception: ThemeError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => ThemeError) ??
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
