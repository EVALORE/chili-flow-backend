import { ConfigService } from '@nestjs/config';
import { JamendoClient } from './jamendo.client';

describe('JamendoClient logging', () => {
  const originalFetch = global.fetch;

  const createClient = () => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'jamendo.apiBaseUrl': 'https://api.jamendo.test/v3.0',
          'jamendo.clientId': 'secret-client-id',
        };

        return values[key];
      }),
    } as unknown as ConfigService;

    const client = new JamendoClient(configService);
    const logger = { error: jest.fn(), warn: jest.fn() };
    (client as unknown as { logger: typeof logger }).logger = logger;

    return { client, logger };
  };

  beforeEach(() => {
    global.fetch = jest.fn() as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('logs fetch failures with operation and path without leaking full URLs', async () => {
    const { client, logger } = createClient();
    const fetchMock = global.fetch as jest.Mock;

    fetchMock.mockRejectedValueOnce(
      new Error(
        'request failed for https://api.jamendo.test/v3.0/tracks?client_id=secret-client-id&format=json',
      ),
    );

    await expect(client.get('/tracks')).rejects.toThrow(
      'Unable to reach Jamendo API',
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('operation=get path=/v3.0/tracks'),
    );
    const logMessage = logger.error.mock.calls[0][0] as string;
    expect(logMessage).toContain('https://api.jamendo.test/v3.0/tracks');
    expect(logMessage).not.toContain('client_id=secret-client-id');
    expect(logMessage).not.toContain('format=json');
  });

  it('logs non-OK upstream responses with status and path only', async () => {
    const { client, logger } = createClient();
    const fetchMock = global.fetch as jest.Mock;

    fetchMock.mockResolvedValueOnce(
      new Response('upstream unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
      }),
    );

    await expect(client.get('/tracks')).rejects.toThrow(
      'Failed to fetch data from Jamendo API',
    );

    expect(logger.error).toHaveBeenCalledWith(
      'Jamendo API failure: operation=get path=/v3.0/tracks status=503 statusText=Service Unavailable',
    );
  });

  it('logs unexpected responses without full response bodies or client IDs', async () => {
    const { client, logger } = createClient();
    const fetchMock = global.fetch as jest.Mock;

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          client_id: 'secret-client-id',
          results: [{ secret: 'full-body-secret' }],
        }),
        {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
        },
      ),
    );

    await expect(client.get('/tracks')).rejects.toThrow(
      'Jamendo API returned an unexpected response',
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'Jamendo API failure: operation=get path=/v3.0/tracks unexpected response',
      ),
    );
    const logMessage = logger.error.mock.calls[0][0] as string;
    expect(logMessage).not.toContain('secret-client-id');
    expect(logMessage).not.toContain('full-body-secret');
  });
});
