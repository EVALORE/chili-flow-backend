import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecentlyPlayedService } from './recently-played.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreateRecentlyPlayedDto } from './dto/create-recently-played.dto';
import { RecentlyPlayedQueryDto } from './dto/recently-played-query.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RecentlyPlayedResponseDto } from './dto/recently-played-response.dto';

@ApiTags('recently-played')
@ApiBearerAuth('bearer')
@Controller('recently-played')
@UseGuards(JwtAuthGuard)
export class RecentlyPlayedController {
  constructor(private readonly recentlyPlayedService: RecentlyPlayedService) {}

  @Post()
  @ApiCreatedResponse({ type: RecentlyPlayedResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRecentlyPlayedDto,
  ) {
    return this.recentlyPlayedService.create(user.id, dto);
  }

  @Get()
  @ApiOkResponse({ type: RecentlyPlayedResponseDto, isArray: true })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query()
    query: RecentlyPlayedQueryDto,
  ) {
    return this.recentlyPlayedService.list(user.id, query);
  }
}
