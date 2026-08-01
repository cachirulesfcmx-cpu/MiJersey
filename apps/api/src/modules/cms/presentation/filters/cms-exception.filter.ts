import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  CmsError,
  InvalidPageBlockError,
  PageNotFoundError,
  PageSlugAlreadyExistsError,
  PageVersionNotFoundError,
} from '../../domain/errors/cms.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => CmsError, number>([
  [PageNotFoundError, HttpStatus.NOT_FOUND],
  [PageVersionNotFoundError, HttpStatus.NOT_FOUND],
  [PageSlugAlreadyExistsError, HttpStatus.CONFLICT],
  [InvalidPageBlockError, HttpStatus.BAD_REQUEST],
]);

function deriveErrorCode(error: CmsError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(CmsError)
export class CmsExceptionFilter implements ExceptionFilter {
  catch(exception: CmsError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => CmsError) ??
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
