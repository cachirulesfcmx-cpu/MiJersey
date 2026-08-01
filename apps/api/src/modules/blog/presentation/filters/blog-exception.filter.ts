import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  BlogCategoryNotFoundError,
  BlogCategorySlugAlreadyExistsError,
  BlogError,
  BlogTagNotFoundError,
  BlogTagSlugAlreadyExistsError,
  PostNotFoundError,
  PostSlugAlreadyExistsError,
  PostVersionNotFoundError,
} from '../../domain/errors/blog.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => BlogError, number>([
  [PostNotFoundError, HttpStatus.NOT_FOUND],
  [PostVersionNotFoundError, HttpStatus.NOT_FOUND],
  [BlogCategoryNotFoundError, HttpStatus.NOT_FOUND],
  [BlogTagNotFoundError, HttpStatus.NOT_FOUND],
  [PostSlugAlreadyExistsError, HttpStatus.CONFLICT],
  [BlogCategorySlugAlreadyExistsError, HttpStatus.CONFLICT],
  [BlogTagSlugAlreadyExistsError, HttpStatus.CONFLICT],
]);

function deriveErrorCode(error: BlogError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(BlogError)
export class BlogExceptionFilter implements ExceptionFilter {
  catch(exception: BlogError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => BlogError) ??
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
