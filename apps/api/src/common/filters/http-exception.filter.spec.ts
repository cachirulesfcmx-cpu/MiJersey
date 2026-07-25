import { NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  it('formats an HttpException into the uniform error shape', () => {
    const filter = new HttpExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ id: 'req-1', headers: {} }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new NotFoundException('Not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 'NOT_FOUND',
        message: 'Not found',
        requestId: 'req-1',
      },
    });
  });

  it('falls back to the incoming x-request-id header when no request id was assigned', () => {
    const filter = new HttpExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ headers: { 'x-request-id': 'incoming-id' } }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new NotFoundException('Not found'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ requestId: 'incoming-id' }) }),
    );
  });
});
