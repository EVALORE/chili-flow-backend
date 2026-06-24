import appConfig from './app.config';
import { AuthTransport } from './auth-transport';

describe('appConfig auth transport defaults', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAuthTransport = process.env.AUTH_TRANSPORT;
  const originalFrontendOrigin = process.env.FRONTEND_ORIGIN;

  afterEach(() => {
    restoreEnvironment('NODE_ENV', originalNodeEnv);
    restoreEnvironment('AUTH_TRANSPORT', originalAuthTransport);
    restoreEnvironment('FRONTEND_ORIGIN', originalFrontendOrigin);
  });

  it('defaults to both outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.AUTH_TRANSPORT;

    expect(appConfig().auth.transport).toBe(AuthTransport.Both);
  });

  it('defaults to cookie in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.AUTH_TRANSPORT;

    expect(appConfig().auth.transport).toBe(AuthTransport.Cookie);
  });

  it('honors an explicit transport override', () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TRANSPORT = AuthTransport.Bearer;

    expect(appConfig().auth.transport).toBe(AuthTransport.Bearer);
  });

  it('parses comma-separated frontend origins', () => {
    process.env.FRONTEND_ORIGIN =
      'http://localhost:5173/, http://127.0.0.1:5173';

    expect(appConfig().app.frontendOrigins).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]);
    expect(appConfig().app.frontendOrigin).toBe('http://localhost:5173');
  });
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
