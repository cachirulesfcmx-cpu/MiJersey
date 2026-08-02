import type { ApiErrorResponse } from '@mijersey/shared-types';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  DuplicateEmailTemplateKeyError,
  EmailLayoutNotFoundError,
  EmailTemplateError,
  EmailTemplateNotFoundError,
  EmailTemplateVersionNotFoundError,
} from '../../domain/errors/email-template.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => EmailTemplateError, number>([
  [EmailTemplateNotFoundError, HttpStatus.NOT_FOUND],
  [EmailTemplateVersionNotFoundError, HttpStatus.NOT_FOUND],
  [EmailLayoutNotFoundError, HttpStatus.NOT_FOUND],
  [DuplicateEmailTemplateKeyError, HttpStatus.CONFLICT],
]);

function deriveErrorCode(error: EmailTemplateError): string {
  return error.constructor.name
    .replace(/Error$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();
}

@Catch(EmailTemplateError)
export class EmailTemplateExceptionFilter implements ExceptionFilter {
  catch(exception: EmailTemplateError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      STATUS_BY_ERROR.get(exception.constructor as new (...args: never[]) => EmailTemplateError) ??
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
