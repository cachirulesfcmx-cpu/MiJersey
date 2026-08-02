import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  AnalyticsDashboardNotFoundError,
  AnalyticsError,
} from '../../domain/errors/analytics.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => Error, number>([
  [AnalyticsDashboardNotFoundError, HttpStatus.NOT_FOUND],
]);

function deriveErrorCode(error: Error): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

/** Además de `AnalyticsError` (dominio), captura `RangeError` — `resolveDateRange` lanza `RangeError` nativo para rangos de fecha inválidos (spec §4), no un error de dominio propio, ya que valida un input primitivo, no una regla de negocio. */
@Catch(AnalyticsError, RangeError)
export class AnalyticsExceptionFilter implements ExceptionFilter {
  catch(exception: AnalyticsError | RangeError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => Error) ??
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
