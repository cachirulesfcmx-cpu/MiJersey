import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  DuplicateWishlistItemError,
  ProductNotFoundError,
  SharedWishlistNotFoundError,
  WishlistError,
  WishlistItemNotFoundError,
} from '../../domain/errors/wishlist.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => WishlistError, number>([
  [WishlistItemNotFoundError, HttpStatus.NOT_FOUND],
  [SharedWishlistNotFoundError, HttpStatus.NOT_FOUND],
  [ProductNotFoundError, HttpStatus.NOT_FOUND],
  [DuplicateWishlistItemError, HttpStatus.CONFLICT],
]);

function deriveErrorCode(error: WishlistError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(WishlistError)
export class WishlistExceptionFilter implements ExceptionFilter {
  catch(exception: WishlistError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => WishlistError) ??
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
