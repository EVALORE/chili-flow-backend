import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthTransportService } from '../auth-transport.service';
import { UnsafeOriginGuard } from './unsafe-origin.guard';

describe('UnsafeOriginGuard', () => {
  const context = (method: string, origin?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ method, headers: { origin } }),
      }),
    }) as unknown as ExecutionContext;

  it('rejects unsafe requests from another browser origin in cookie mode', () => {
    const authTransport = {
      allowsCookie: () => true,
      frontendOrigin: 'https://app.example.com',
      frontendOrigins: ['https://app.example.com', 'https://admin.example.com'],
    } as AuthTransportService;
    const guard = new UnsafeOriginGuard(authTransport);

    expect(() =>
      guard.canActivate(context('POST', 'https://evil.example')),
    ).toThrow(ForbiddenException);
    expect(guard.canActivate(context('POST', 'https://app.example.com'))).toBe(
      true,
    );
    expect(
      guard.canActivate(context('POST', 'https://admin.example.com')),
    ).toBe(true);
  });

  it('allows safe methods, non-browser clients, and bearer-only mode', () => {
    const authTransport = {
      allowsCookie: () => true,
      frontendOrigin: 'https://app.example.com',
      frontendOrigins: ['https://app.example.com'],
    } as AuthTransportService;

    expect(
      new UnsafeOriginGuard(authTransport).canActivate(
        context('GET', 'https://evil.example'),
      ),
    ).toBe(true);
    expect(
      new UnsafeOriginGuard(authTransport).canActivate(context('POST')),
    ).toBe(true);

    authTransport.allowsCookie = () => false;
    expect(
      new UnsafeOriginGuard(authTransport).canActivate(
        context('POST', 'https://evil.example'),
      ),
    ).toBe(true);
  });
});
