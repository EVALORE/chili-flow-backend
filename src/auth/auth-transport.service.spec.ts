import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { AuthTransport } from '../config/auth-transport';
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE_MS,
  AuthTransportService,
} from './auth-transport.service';

describe('AuthTransportService', () => {
  const session = {
    user: {
      id: 'user-1',
      email: 'user@example.com',
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    },
    accessToken: 'signed-token',
  };

  const createService = (transport: AuthTransport, nodeEnv = 'development') => {
    const values: Record<string, unknown> = {
      'auth.transport': transport,
      'app.frontendOrigin': 'http://localhost:5173',
      'app.frontendOrigins': ['http://localhost:5173', 'http://127.0.0.1:5173'],
      'app.nodeEnv': nodeEnv,
    };
    const configService = {
      getOrThrow: jest.fn((key: string) => values[key]),
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;

    return new AuthTransportService(configService);
  };

  const createResponse = () => {
    const cookie = jest.fn();
    const clearCookie = jest.fn();

    return {
      cookie,
      clearCookie,
      response: { cookie, clearCookie } as unknown as Response,
    };
  };

  const createRequest = (headers: Record<string, string> = {}) =>
    ({ headers }) as unknown as Request;

  it.each([
    [AuthTransport.Cookie, false, true],
    [AuthTransport.Bearer, true, false],
    [AuthTransport.Both, true, true],
  ])(
    'issues the expected credentials in %s mode',
    (transport, includesToken, setsCookie) => {
      const service = createService(transport);
      const { cookie, response } = createResponse();

      const result = service.issue(response, session);

      expect('accessToken' in result).toBe(includesToken);
      expect(cookie).toHaveBeenCalledTimes(setsCookie ? 1 : 0);

      if (setsCookie) {
        expect(cookie).toHaveBeenCalledWith(
          AUTH_COOKIE_NAME,
          session.accessToken,
          expect.objectContaining({
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/',
            maxAge: AUTH_SESSION_MAX_AGE_MS,
          }),
        );
      }
    },
  );

  it('uses secure cookies in production and clears them with matching options', () => {
    const service = createService(AuthTransport.Cookie, 'production');
    const { clearCookie, cookie, response } = createResponse();

    service.issue(response, session);
    service.clear(response);

    expect(cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      session.accessToken,
      expect.objectContaining({ secure: true }),
    );
    expect(clearCookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
    });
  });

  it('extracts only credentials enabled by the configured mode', () => {
    const cookieRequest = createRequest({
      cookie: `${AUTH_COOKIE_NAME}=cookie-token`,
    });
    const bearerRequest = createRequest({
      authorization: 'Bearer bearer-token',
    });

    expect(createService(AuthTransport.Cookie).extract(cookieRequest)).toBe(
      'cookie-token',
    );
    expect(
      createService(AuthTransport.Cookie).extract(bearerRequest),
    ).toBeNull();
    expect(
      createService(AuthTransport.Bearer).extract(cookieRequest),
    ).toBeNull();
    expect(createService(AuthTransport.Bearer).extract(bearerRequest)).toBe(
      'bearer-token',
    );
  });

  it('rejects credentials from a disabled transport', async () => {
    const jwtService = {} as JwtService;

    await expect(
      createService(AuthTransport.Cookie).assertCredentialsAllowed(
        createRequest({ authorization: 'Bearer bearer-token' }),
        jwtService,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    await expect(
      createService(AuthTransport.Bearer).assertCredentialsAllowed(
        createRequest({ cookie: `${AUTH_COOKIE_NAME}=cookie-token` }),
        jwtService,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts matching dual credentials and rejects mismatches or invalid tokens', async () => {
    const service = createService(AuthTransport.Both);
    const request = createRequest({
      cookie: `${AUTH_COOKIE_NAME}=cookie-token`,
      authorization: 'Bearer bearer-token',
    });
    const verifyAsync = jest
      .fn()
      .mockResolvedValueOnce({ sub: 'user-1' })
      .mockResolvedValueOnce({ sub: 'user-1' });
    const jwtService = { verifyAsync } as unknown as JwtService;

    await expect(
      service.assertCredentialsAllowed(request, jwtService),
    ).resolves.toBeUndefined();

    verifyAsync
      .mockResolvedValueOnce({ sub: 'user-1' })
      .mockResolvedValueOnce({ sub: 'user-2' });
    await expect(
      service.assertCredentialsAllowed(request, jwtService),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    verifyAsync.mockRejectedValueOnce(new Error('bad'));
    await expect(
      service.assertCredentialsAllowed(request, jwtService),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
