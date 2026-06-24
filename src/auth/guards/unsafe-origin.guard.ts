import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthTransportService } from '../auth-transport.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class UnsafeOriginGuard implements CanActivate {
  constructor(private readonly authTransport: AuthTransportService) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.authTransport.allowsCookie()) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const origin = request.headers.origin;

    if (
      SAFE_METHODS.has(request.method.toUpperCase()) ||
      !origin ||
      this.authTransport.frontendOrigins.includes(origin)
    ) {
      return true;
    }

    throw new ForbiddenException('Origin is not allowed');
  }
}
