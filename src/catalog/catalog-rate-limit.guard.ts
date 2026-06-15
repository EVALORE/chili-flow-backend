import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class CatalogRateLimitGuard implements CanActivate {
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(private readonly configService: ConfigService) {
    this.windowMs =
      this.configService.getOrThrow<number>('catalog.rateLimitWindowSeconds') *
      1000;
    this.maxRequests = this.configService.getOrThrow<number>(
      'catalog.rateLimitMaxRequests',
    );
  }

  canActivate(context: ExecutionContext) {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const now = Date.now();
    const key = this.getClientKey(request);
    let bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = {
        count: 0,
        resetAt: now + this.windowMs,
      };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(this.maxRequests - bucket.count, 0);
    const resetSeconds = Math.max(Math.ceil((bucket.resetAt - now) / 1000), 0);

    response.setHeader('X-RateLimit-Limit', String(this.maxRequests));
    response.setHeader('X-RateLimit-Remaining', String(remaining));
    response.setHeader(
      'X-RateLimit-Reset',
      String(Math.ceil(bucket.resetAt / 1000)),
    );

    if (bucket.count > this.maxRequests) {
      response.setHeader('Retry-After', String(resetSeconds));
      throw new HttpException(
        'Catalog rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getClientKey(request: Request) {
    return request.ip || request.socket.remoteAddress || 'unknown';
  }
}
