import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from '@mijersey/shared-types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { id?: string }>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? this.extractMessage(exception) : 'Internal server error';

    const code =
      exception instanceof HttpException ? this.deriveErrorCode(exception) : 'INTERNAL_ERROR';

    const requestId = request.id ?? request.headers['x-request-id']?.toString() ?? 'unknown';

    const body: ApiErrorResponse = {
      error: { code, message, requestId },
    };

    response.status(status).json(body);
  }

  private extractMessage(exception: HttpException): string {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null && 'message' in response) {
      const msg = (response as { message: unknown }).message;
      return Array.isArray(msg) ? msg.join(', ') : String(msg);
    }

    return exception.message;
  }

  private deriveErrorCode(exception: HttpException): string {
    const name = exception.constructor.name.replace(/Exception$/, '');
    return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
  }
}
