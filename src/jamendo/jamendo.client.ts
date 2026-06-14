import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JamendoResponse } from './jamendo.types';

type JamendoQueryValue =
  | string
  | number
  | boolean
  | readonly string[]
  | undefined;

type JamendoQueryParams = Record<string, JamendoQueryValue>;

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
      if (value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, String(item));
        }

        continue;
      }

      url.searchParams.set(key, String(value));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;

    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logUpstreamFailure('get', url.pathname, 'request timed out');
        throw new BadGatewayException('Jamendo API request timed out');
      }

      const message = this.getSafeErrorMessage(error);
      this.logUpstreamFailure('get', url.pathname, message);
      throw new BadGatewayException(`Unable to reach Jamendo API: ${message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      this.logUpstreamFailure(
        'get',
        url.pathname,
        `status=${response.status} statusText=${response.statusText}`,
      );
      throw new BadGatewayException(
        `Failed to fetch data from Jamendo API: ${response.status} ${response.statusText}`,
      );
    }

    let body: JamendoResponse<T>;

    try {
      body = (await response.json()) as JamendoResponse<T>;
    } catch (error) {
      const message = this.getSafeErrorMessage(error);
      this.logUpstreamFailure('get', url.pathname, `invalid JSON: ${message}`);
      throw new BadGatewayException('Jamendo API returned invalid JSON');
    }

    if (body.headers?.warnings) {
      this.logger.warn(`Jamendo API warning: ${body.headers.warnings}`);
    }

    this._assertSuccess(url.pathname, body);

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
      if (error instanceof Error && error.name === 'AbortError') {
        this.logUpstreamFailure(
          'getRedirectUrl',
          url.pathname,
          'request timed out',
        );
        throw new BadGatewayException('Jamendo API request timed out');
      }

      const message = this.getSafeErrorMessage(error);
      this.logUpstreamFailure('getRedirectUrl', url.pathname, message);
      throw new BadGatewayException(`Unable to reach Jamendo API: ${message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 404) {
      throw new BadRequestException('Jamendo track file is unavailable');
    }

    if (response.status < 300 || response.status >= 400) {
      this.logUpstreamFailure(
        'getRedirectUrl',
        url.pathname,
        `status=${response.status} statusText=${response.statusText}`,
      );
      throw new BadGatewayException(
        `Failed to fetch Jamendo file redirect: ${response.status} ${response.statusText}`,
      );
    }

    const location = response.headers.get('location');

    if (!location) {
      this.logUpstreamFailure(
        'getRedirectUrl',
        url.pathname,
        'missing redirect location',
      );
      throw new BadGatewayException('Jamendo API did not return a file URL');
    }

    return location;
  }

  private _assertSuccess<T>(path: string, body: JamendoResponse<T>) {
    if (!body.headers || typeof body.headers.code !== 'number') {
      this.logUpstreamFailure(
        'get',
        path,
        `unexpected response hasHeaders=${Boolean(body.headers)} resultsType=${typeof body.results}`,
      );
      throw new BadGatewayException(
        'Jamendo API returned an unexpected response',
      );
    }

    const message =
      body.headers.error_message ||
      `Jamendo API returned an error: ${body.headers.code} ${body.headers.error_message}`;

    if (body.headers.code !== 0) {
      this.logUpstreamFailure(
        'get',
        path,
        `code=${body.headers.code} message=${this.sanitizeLogMessage(message)}`,
      );
    }

    switch (body.headers.code) {
      case 0:
        return;
      case 3:
      case 4:
      case 7:
        throw new BadRequestException(message);
      case 6:
        throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
      case 5:
      case 12:
      case 13:
        throw new UnauthorizedException(message);
      default:
        throw new BadGatewayException(message);
    }
  }

  private logUpstreamFailure(operation: string, path: string, detail: string) {
    this.logger.error(
      `Jamendo API failure: operation=${operation} path=${path} ${detail}`,
    );
  }

  private getSafeErrorMessage(error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return this.sanitizeLogMessage(message);
  }

  private sanitizeLogMessage(message: string) {
    return message
      .replace(/bearer\s+[^\s]+/gi, 'Bearer [redacted]')
      .replace(/client_id=[^&\s]+/gi, 'client_id=[redacted]')
      .replace(
        /(client_secret|password|token|secret)=([^&\s]+)/gi,
        '$1=[redacted]',
      )
      .replace(/https?:\/\/\S+/gi, (rawUrl) => {
        try {
          const parsedUrl = new URL(rawUrl);
          return `${parsedUrl.origin}${parsedUrl.pathname}`;
        } catch {
          return '[redacted-url]';
        }
      });
  }
}
