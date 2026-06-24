import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CookieOptions, Request, Response } from 'express';
import { ExtractJwt } from 'passport-jwt';
import { AuthTransport } from '../config/auth-transport';
import { AuthResponseDto } from './dto/auth-response.dto';
import type { AuthSession } from './auth.service';
import type { JwtPayload } from './strategies/jwt.strategy';

export const AUTH_COOKIE_NAME = 'chili_flow_session';
export const AUTH_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthTransportService {
  readonly transport: AuthTransport;
  readonly frontendOrigin: string;
  readonly frontendOrigins: string[];

  constructor(private readonly configService: ConfigService) {
    this.transport = configService.getOrThrow<AuthTransport>('auth.transport');
    this.frontendOrigin =
      configService.getOrThrow<string>('app.frontendOrigin');
    this.frontendOrigins = configService.get<string[]>(
      'app.frontendOrigins',
    ) ?? [this.frontendOrigin];
  }

  allowsCookie(): boolean {
    return (
      this.transport === AuthTransport.Cookie ||
      this.transport === AuthTransport.Both
    );
  }

  allowsBearer(): boolean {
    return (
      this.transport === AuthTransport.Bearer ||
      this.transport === AuthTransport.Both
    );
  }

  issue(response: Response, session: AuthSession): AuthResponseDto {
    if (this.allowsCookie()) {
      response.cookie(
        AUTH_COOKIE_NAME,
        session.accessToken,
        this.cookieOptions(),
      );
    }

    return {
      user: session.user,
      ...(this.allowsBearer() ? { accessToken: session.accessToken } : {}),
    };
  }

  clear(response: Response): void {
    response.clearCookie(AUTH_COOKIE_NAME, this.cookieOptions(false));
  }

  extract(request: Request): string | null {
    const cookieToken = this.getCookieToken(request);
    const bearerToken = this.getBearerToken(request);

    if (this.allowsCookie() && cookieToken) {
      return cookieToken;
    }

    if (this.allowsBearer() && bearerToken) {
      return bearerToken;
    }

    return null;
  }

  async assertCredentialsAllowed(
    request: Request,
    jwtService: JwtService,
  ): Promise<void> {
    const cookieToken = this.getCookieToken(request);
    const bearerToken = this.getBearerToken(request);

    if (cookieToken && !this.allowsCookie()) {
      throw new UnauthorizedException('Cookie authentication is disabled');
    }

    if (bearerToken && !this.allowsBearer()) {
      throw new UnauthorizedException('Bearer authentication is disabled');
    }

    if (!cookieToken || !bearerToken) {
      return;
    }

    try {
      const [cookiePayload, bearerPayload] = await Promise.all([
        jwtService.verifyAsync<JwtPayload>(cookieToken),
        jwtService.verifyAsync<JwtPayload>(bearerToken),
      ]);

      if (
        !cookiePayload.sub ||
        !bearerPayload.sub ||
        cookiePayload.sub !== bearerPayload.sub
      ) {
        throw new UnauthorizedException('Authentication credentials mismatch');
      }
    } catch {
      throw new UnauthorizedException('Invalid authentication credentials');
    }
  }

  private getCookieToken(request: Request): string | null {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      return null;
    }

    for (const part of cookieHeader.split(';')) {
      const separatorIndex = part.indexOf('=');

      if (separatorIndex === -1) {
        continue;
      }

      const name = part.slice(0, separatorIndex).trim();

      if (name !== AUTH_COOKIE_NAME) {
        continue;
      }

      const value = part.slice(separatorIndex + 1).trim();

      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }

    return null;
  }

  private getBearerToken(request: Request): string | null {
    return ExtractJwt.fromAuthHeaderAsBearerToken()(request) ?? null;
  }

  private cookieOptions(includeMaxAge = true): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure:
        this.configService.getOrThrow<string>('app.nodeEnv') === 'production',
      path: '/',
      ...(includeMaxAge ? { maxAge: AUTH_SESSION_MAX_AGE_MS } : {}),
    };
  }
}
