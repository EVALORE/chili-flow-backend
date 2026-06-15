import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CatalogRateLimitGuard } from './catalog-rate-limit.guard';

describe('CatalogRateLimitGuard', () => {
  let now = 1_000;

  const createGuard = (windowSeconds = 60, maxRequests = 2) => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, number> = {
          'catalog.rateLimitWindowSeconds': windowSeconds,
          'catalog.rateLimitMaxRequests': maxRequests,
        };

        return values[key];
      }),
    } as unknown as ConfigService;

    return new CatalogRateLimitGuard(configService);
  };

  const createContext = (ip = '127.0.0.1') => {
    const response = {
      setHeader: jest.fn(),
    };
    const request = {
      ip,
      socket: { remoteAddress: ip },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request as unknown as Request,
        getResponse: () => response as unknown as Response,
      }),
    } as unknown as ExecutionContext;

    return { context, response };
  };

  beforeEach(() => {
    now = 1_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows requests under the configured limit', () => {
    const guard = createGuard(60, 2);

    expect(guard.canActivate(createContext().context)).toBe(true);
    expect(guard.canActivate(createContext().context)).toBe(true);
  });

  it('throws when the client exceeds the configured limit', () => {
    const guard = createGuard(60, 2);

    guard.canActivate(createContext().context);
    guard.canActivate(createContext().context);

    expect(() => guard.canActivate(createContext().context)).toThrow(
      HttpException,
    );

    try {
      guard.canActivate(createContext().context);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('allows requests again after the rate-limit window resets', () => {
    const guard = createGuard(60, 1);

    expect(guard.canActivate(createContext().context)).toBe(true);
    now = 61_001;

    expect(guard.canActivate(createContext().context)).toBe(true);
  });

  it('sets rate-limit response headers', () => {
    const guard = createGuard(60, 2);
    const { context, response } = createContext();

    guard.canActivate(context);

    expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '2');
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Remaining',
      '1',
    );
    expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', '61');
  });

  it('sets retry-after when rejecting a request', () => {
    const guard = createGuard(60, 1);
    const first = createContext();
    const second = createContext();

    guard.canActivate(first.context);

    expect(() => guard.canActivate(second.context)).toThrow(HttpException);
    expect(second.response.setHeader).toHaveBeenCalledWith('Retry-After', '60');
  });
});
