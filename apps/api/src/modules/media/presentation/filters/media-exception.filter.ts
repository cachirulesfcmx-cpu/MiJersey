import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  AssetTagNotFoundError,
  FolderCycleError,
  FolderNotEmptyError,
  FolderNotFoundError,
  FolderSlugAlreadyExistsError,
  InvalidSlugError,
  InvalidUploadError,
  MediaAssetInUseError,
  MediaAssetNotFoundError,
  MediaError,
  UnsupportedMediaTypeError,
} from '../../domain/errors/media.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => MediaError, number>([
  [MediaAssetNotFoundError, HttpStatus.NOT_FOUND],
  [UnsupportedMediaTypeError, HttpStatus.BAD_REQUEST],
  [MediaAssetInUseError, HttpStatus.CONFLICT],
  [FolderNotFoundError, HttpStatus.NOT_FOUND],
  [FolderSlugAlreadyExistsError, HttpStatus.CONFLICT],
  [FolderCycleError, HttpStatus.BAD_REQUEST],
  [FolderNotEmptyError, HttpStatus.CONFLICT],
  [InvalidUploadError, HttpStatus.BAD_REQUEST],
  [InvalidSlugError, HttpStatus.BAD_REQUEST],
  [AssetTagNotFoundError, HttpStatus.NOT_FOUND],
]);

function deriveErrorCode(error: MediaError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

/** Traduce los errores del dominio Media al contrato uniforme de error de la API. */
@Catch(MediaError)
export class MediaExceptionFilter implements ExceptionFilter {
  catch(exception: MediaError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => MediaError) ??
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
