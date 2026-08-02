import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import { SiteConfigError } from '../../domain/errors/site-config.errors';

function deriveErrorCode(error: SiteConfigError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(SiteConfigError)
export class SiteConfigExceptionFilter implements ExceptionFilter {
  catch(exception: SiteConfigError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const requestId = request.id ?? request.headers['x-request-id']?.toString() ?? 'unknown';

    const body: ApiErrorResponse = {
      error: {
        code: deriveErrorCode(exception),
        message: exception.message,
        requestId,
      },
    };

    response.status(HttpStatus.BAD_REQUEST).json(body);
  }
}
