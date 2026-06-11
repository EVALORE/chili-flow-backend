import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JamendoResponse } from './jamendo.types';

type JamendoQueryParams = Record<string, string | number | boolean | undefined>;

const TIMEOUT_MS = 10_000 as const;

@Injectable()
export class JamendoClient {
  private readonly logger = new Logger(JamendoClient.name);

  constructor(private readonly configService: ConfigService) {}

  async get<T>(path: string, params: JamendoQueryParams = {}) {
    const baseUrl = this.configService.getOrThrow<string>('jamendo.apiBaseUrl');
    const clientId = this.configService.getOrThrow<string>('jamendo.clientId');

    const url = new URL(`${baseUrl}${path}`);

    url.searchParams.set('client_id', clientId);
    url.searchParams.set('format', 'json');

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;

    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error(`Jamendo API request timed out: ${url.pathname}`);
        throw new BadGatewayException('Jamendo API request timed out');
      }

      this.logger.error(`Jamendo API request failed: ${message}`);
      throw new BadGatewayException(`Unable to reach Jamendo API: ${message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `Failed to fetch data from Jamendo API: ${response.status} ${response.statusText}`,
      );
    }

    let body: JamendoResponse<T>;

    try {
      body = (await response.json()) as JamendoResponse<T>;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Jamendo API returned invalid JSON: ${message}`);
      throw new BadGatewayException('Jamendo API returned invalid JSON');
    }

    if (body.headers?.warnings) {
      this.logger.warn(`Jamendo API warning: ${body.headers.warnings}`);
    }

    this._assertSuccess(body);

    return body;
  }

  async getRedirectUrl(
    path: string,
    params: JamendoQueryParams = {},
  ): Promise<string> {
    const baseUrl = this.configService.getOrThrow<string>('jamendo.apiBaseUrl');
    const clientId = this.configService.getOrThrow<string>('jamendo.clientId');

    const url = new URL(`${baseUrl}${path}`);

    url.searchParams.set('client_id', clientId);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;

    try {
      response = await fetch(url, {
        signal: controller.signal,
        redirect: 'manual',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error('Jamendo API request timed out: ${url.pathname');
        throw new BadGatewayException('Jamendo API request timed out');
      }

      this.logger.error(`Jamendo API request failed: ${message}`);
      throw new BadGatewayException(`Unable to reach Jamendo API" ${message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 404) {
      throw new BadRequestException('Jamendo track file is unavailable');
    }

    if (response.status < 300 || response.status >= 400) {
      throw new BadGatewayException(
        `Failed to fetch Jamendo file redirect: ${response.status} ${response.statusText}`,
      );
    }

    const location = response.headers.get('location');

    if (!location) {
      throw new BadGatewayException('Jamendo API did not return a file URL');
    }

    return location;
  }

  private _assertSuccess<T>(body: JamendoResponse<T>) {
    if (!body.headers || typeof body.headers.code !== 'number') {
      this.logger.error(
        `Unexpected Jamendo API response: ${JSON.stringify(body)}`,
      );
      throw new BadGatewayException(
        'Jamendo API returned an unexpected response',
      );
    }

    const message =
      body.headers.error_message ||
      `Jamendo API returned an error: ${body.headers.code} ${body.headers.error_message}`;

    switch (body.headers.code) {
      case 0:
        return;
      case 3:
      case 4:
      case 6:
      case 7:
        throw new BadRequestException(message);
      case 5:
      case 12:
      case 13:
        throw new UnauthorizedException(message);
      default:
        throw new BadGatewayException(message);
    }
  }
}
