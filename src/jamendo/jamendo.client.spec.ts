import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
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

  it('constructs GET URLs with client credentials, format, scalar params, and array params', async () => {
    const { client } = createClient();
    const fetchMock = global.fetch as jest.Mock;

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          headers: { code: 0, status: 'success', error_message: '' },
          results: [],
        }),
      ),
    );

    await client.get('/tracks', {
      search: 'chill',
      limit: 20,
      tags: ['ambient', 'electronic'],
      offset: undefined,
    });

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);

    expect(requestedUrl.origin).toBe('https://api.jamendo.test');
    expect(requestedUrl.pathname).toBe('/v3.0/tracks');
    expect(requestedUrl.searchParams.get('client_id')).toBe('secret-client-id');
    expect(requestedUrl.searchParams.get('format')).toBe('json');
    expect(requestedUrl.searchParams.get('search')).toBe('chill');
    expect(requestedUrl.searchParams.get('limit')).toBe('20');
    expect(requestedUrl.searchParams.getAll('tags')).toEqual([
      'ambient',
      'electronic',
    ]);
    expect(requestedUrl.searchParams.has('offset')).toBe(false);
  });

  it.each([
    [3, HttpStatus.BAD_REQUEST],
    [4, HttpStatus.BAD_REQUEST],
    [7, HttpStatus.BAD_REQUEST],
    [6, HttpStatus.TOO_MANY_REQUESTS],
    [5, HttpStatus.UNAUTHORIZED],
    [12, HttpStatus.UNAUTHORIZED],
    [13, HttpStatus.UNAUTHORIZED],
  ])(
    'maps Jamendo response code %s to HTTP status %s',
    async (code, status) => {
      const { client } = createClient();
      const fetchMock = global.fetch as jest.Mock;

      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            headers: {
              code,
              status: 'failed',
              error_message: `Jamendo error ${code}`,
            },
            results: [],
          }),
        ),
      );

      await expect(client.get('/tracks')).rejects.toMatchObject({
        status,
      });
    },
  );

  it('maps unknown Jamendo response codes to a bad gateway error', async () => {
    const { client } = createClient();
    const fetchMock = global.fetch as jest.Mock;

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          headers: {
            code: 999,
            status: 'failed',
            error_message: 'Unexpected Jamendo error',
          },
          results: [],
        }),
      ),
    );

    await expect(client.get('/tracks')).rejects.toMatchObject({
      status: HttpStatus.BAD_GATEWAY,
    });
  });

  it('returns manual redirect locations for track files', async () => {
    const { client } = createClient();
    const fetchMock = global.fetch as jest.Mock;

    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: 'https://files.test/track.mp3' },
      }),
    );

    await expect(
      client.getRedirectUrl('/tracks/file', { id: '1' }),
    ).resolves.toBe('https://files.test/track.mp3');

    const [requestedUrl, options] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(new URL(requestedUrl).searchParams.get('client_id')).toBe(
      'secret-client-id',
    );
    expect(options.redirect).toBe('manual');
  });

  it('returns a controlled error when a track file is unavailable', async () => {
    const { client } = createClient();
    const fetchMock = global.fetch as jest.Mock;

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));

    await expect(
      client.getRedirectUrl('/tracks/file', { id: '1' }),
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
  });

  it('maps aborted requests to timeout errors', async () => {
    const { client } = createClient();
    const fetchMock = global.fetch as jest.Mock;
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';

    fetchMock.mockRejectedValueOnce(abortError);

    await expect(client.get('/tracks')).rejects.toThrow(
      'Jamendo API request timed out',
    );
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
