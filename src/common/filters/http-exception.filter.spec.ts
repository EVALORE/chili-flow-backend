import {
  ArgumentsHost,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpExceptionFilter } from './http-exception.filter';

function createHost(
  request: Partial<Request>,
  response: Partial<Response>,
): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => request as Request,
      getResponse: () => response as Response,
      getNext: jest.fn(),
    }),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  const createResponse = () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    return response;
  };

  it('returns a generic production error for unknown exceptions', () => {
    const logger = { error: jest.fn() };
    const filter = new HttpExceptionFilter('production', logger);
    const response = createResponse();

    filter.catch(
      new Error('database password leaked'),
      createHost({ method: 'GET', url: '/health', path: '/health' }, response),
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        path: '/health',
        error: {
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
        },
      }),
    );
  });

  it('sanitizes production 5xx HttpException responses', () => {
    const logger = { error: jest.fn() };
    const filter = new HttpExceptionFilter('production', logger);
    const response = createResponse();

    filter.catch(
      new InternalServerErrorException('database password leaked'),
      createHost({ method: 'GET', url: '/tracks', path: '/tracks' }, response),
    );

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: {
          statusCode: 500,
          message: 'Internal server error',
          error: 'Internal Server Error',
        },
      }),
    );
  });

  it('preserves production 4xx error responses', () => {
    const logger = { error: jest.fn() };
    const filter = new HttpExceptionFilter('production', logger);
    const response = createResponse();

    filter.catch(
      new NotFoundException('Track not found'),
      createHost({ method: 'GET', url: '/tracks/1', path: '/tracks/1' }, response),
    );

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: {
          statusCode: 404,
          message: 'Track not found',
          error: 'Not Found',
        },
      }),
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('preserves production validation error details', () => {
    const logger = { error: jest.fn() };
    const filter = new HttpExceptionFilter('production', logger);
    const response = createResponse();

    filter.catch(
      new BadRequestException([
        'email must be an email',
        'password must be longer than or equal to 8 characters',
      ]),
      createHost({ method: 'POST', url: '/auth/register', path: '/auth/register' }, response),
    );

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: {
          statusCode: 400,
          message: [
            'email must be an email',
            'password must be longer than or equal to 8 characters',
          ],
          error: 'Bad Request',
        },
      }),
    );
  });

  it('logs 5xx context without query strings, headers, or bodies', () => {
    const logger = { error: jest.fn() };
    const filter = new HttpExceptionFilter('production', logger);
    const response = createResponse();

    filter.catch(
      new Error('database failed with Bearer exception-secret token=message-secret'),
      createHost(
        {
          method: 'POST',
          url: '/tracks?token=query-secret',
          path: '/tracks',
          headers: { authorization: 'Bearer header-secret' },
          body: { password: 'body-secret' },
        },
        response,
      ),
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('POST /tracks status=500'),
    );
    const logMessage = logger.error.mock.calls[0][0] as string;
    expect(logMessage).toContain('database failed');
    expect(logMessage).not.toContain('exception-secret');
    expect(logMessage).not.toContain('message-secret');
    expect(logMessage).not.toContain('query-secret');
    expect(logMessage).not.toContain('header-secret');
    expect(logMessage).not.toContain('body-secret');
  });
});
