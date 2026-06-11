import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      environment: this.configService.getOrThrow<string>('app.nodeEnv'),
    };
  }
}
