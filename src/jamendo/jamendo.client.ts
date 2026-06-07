import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JamendoResponse } from './Jamendo.types';

@Injectable()
export class JamendoClient {
  private readonly logger = new Logger(JamendoClient.name);

  constructor(private readonly configService: ConfigService) {}

  async get<T>(
    path: string,
    params: Record<string, string | number | boolean | undefined>,
  ) {
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

    let response: Response;

    try {
      response = await fetch(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Jamendo API request failed: ${message}`);
      throw new BadGatewayException(`Unable to reach Jamendo API: ${message}`);
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

    this._assertSuccess(body);

    return body;
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

    switch (body.headers.code) {
      case 0:
        return;
      case 3:
      case 4:
        throw new BadRequestException(
          `Jamendo API returned an error: ${body.headers.code} ${body.headers.error_message}`,
        );
      case 5:
      case 12:
      case 13:
        throw new UnauthorizedException(
          `Jamendo API returned an error: ${body.headers.code} ${body.headers.error_message}`,
        );
      case 6:
        throw new BadRequestException(
          `Jamendo API returned an error: ${body.headers.code} ${body.headers.error_message}`,
        );
      default:
        throw new BadGatewayException(
          `Jamendo API returned an error: ${body.headers.code} ${body.headers.error_message}`,
        );
    }
  }
}
