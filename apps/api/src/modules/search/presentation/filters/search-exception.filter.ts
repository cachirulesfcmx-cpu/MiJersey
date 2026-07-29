import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  SearchError,
  SearchSynonymAlreadyExistsError,
  SearchSynonymNotFoundError,
} from '../../domain/errors/search.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => SearchError, number>([
  [SearchSynonymNotFoundError, HttpStatus.NOT_FOUND],
  [SearchSynonymAlreadyExistsError, HttpStatus.CONFLICT],
]);

function deriveErrorCode(error: SearchError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(SearchError)
export class SearchExceptionFilter implements ExceptionFilter {
  catch(exception: SearchError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => SearchError) ??
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
