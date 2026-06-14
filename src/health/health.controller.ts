import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth() {
    return {
      status: 'ok',
      environment: this.configService.getOrThrow<string>('app.nodeEnv'),
    };
  }
}
