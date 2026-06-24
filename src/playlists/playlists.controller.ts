import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreatePlaylistItemDto } from './dto/create-playlist-item.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { ReorderPlaylistItemsDto } from './dto/reorder-playlist-items.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PlaylistsService } from './playlists.service';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import {
  PlaylistDetailResponseDto,
  PlaylistResponseDto,
  PlaylistSummaryResponseDto,
} from './dto/playlist-response.dto';

@ApiTags('playlists')
@ApiBearerAuth('bearer')
@ApiCookieAuth('chili_flow_session')
@Controller('playlists')
@UseGuards(JwtAuthGuard)
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  @ApiOperation({
    summary: 'List playlists',
    description:
      'Returns playlists owned by the authenticated user with item counts and total duration.',
  })
  @ApiOkResponse({ type: PlaylistSummaryResponseDto, isArray: true })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.playlistsService.list(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create playlist',
    description: 'Creates a local playlist owned by the authenticated user.',
  })
  @ApiCreatedResponse({ type: PlaylistResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlaylistDto,
  ) {
    return this.playlistsService.create(user.id, dto);
  }

  @Get(':playlistId')
  @ApiOperation({
    summary: 'Get playlist',
    description:
      'Returns one local playlist owned by the authenticated user, including ordered playlist items.',
  })
  @ApiParam({
    name: 'playlistId',
    description: 'Local playlist ID owned by the authenticated user.',
  })
  @ApiOkResponse({ type: PlaylistDetailResponseDto })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('playlistId') playlistId: string,
  ) {
    return this.playlistsService.findOne(user.id, playlistId);
  }

  @Put(':playlistId')
  @ApiOperation({
    summary: 'Update playlist',
    description:
      'Updates playlist metadata for a playlist owned by the authenticated user.',
  })
  @ApiParam({
    name: 'playlistId',
    description: 'Local playlist ID owned by the authenticated user.',
  })
  @ApiOkResponse({ type: PlaylistResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('playlistId') playlistId: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(user.id, playlistId, dto);
  }

  @Delete(':playlistId')
  @ApiOperation({
    summary: 'Delete playlist',
    description:
      'Deletes a local playlist owned by the authenticated user. This does not delete uploaded-track source files.',
  })
  @ApiParam({
    name: 'playlistId',
    description: 'Local playlist ID owned by the authenticated user.',
  })
  @ApiOkResponse({ type: DeleteResponseDto })
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('playlistId') playlistId: string,
  ) {
    return this.playlistsService.delete(user.id, playlistId);
  }

  @Post(':playlistId/items')
  @ApiOperation({
    summary: 'Create playlist item',
    description:
      'Adds a playlist item to a local playlist. The body sourceId identifies the backing Jamendo catalog track or local uploaded track. Later delete and reorder operations use playlist item IDs, not source IDs.',
  })
  @ApiParam({
    name: 'playlistId',
    description: 'Local playlist ID owned by the authenticated user.',
  })
  @ApiCreatedResponse({ type: PlaylistDetailResponseDto })
  createItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('playlistId') playlistId: string,
    @Body() dto: CreatePlaylistItemDto,
  ) {
    return this.playlistsService.createItem(user.id, playlistId, dto);
  }

  @Delete(':playlistId/items/:playlistItemId')
  @ApiOperation({
    summary: 'Delete playlist item',
    description:
      'Removes one playlist item row from a local playlist. playlistItemId is the item ID returned in playlist responses, not the backing sourceId.',
  })
  @ApiParam({
    name: 'playlistId',
    description: 'Local playlist ID owned by the authenticated user.',
  })
  @ApiParam({
    name: 'playlistItemId',
    description:
      'Playlist item row ID returned in the playlist items array. This is not a Jamendo ID or uploaded-track ID.',
  })
  @ApiOkResponse({ type: PlaylistDetailResponseDto })
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('playlistId') playlistId: string,
    @Param('playlistItemId') playlistItemId: string,
  ) {
    return this.playlistsService.removeItem(
      user.id,
      playlistId,
      playlistItemId,
    );
  }

  @Put(':playlistId/items/reorder')
  @ApiOperation({
    summary: 'Reorder playlist items',
    description:
      'Reorders a playlist by submitting every playlist item ID in the desired order. IDs are playlist item row IDs, not source IDs.',
  })
  @ApiParam({
    name: 'playlistId',
    description: 'Local playlist ID owned by the authenticated user.',
  })
  @ApiOkResponse({ type: PlaylistDetailResponseDto })
  reorderItems(
    @CurrentUser() user: AuthenticatedUser,
    @Param('playlistId') playlistId: string,
    @Body() dto: ReorderPlaylistItemsDto,
  ) {
    return this.playlistsService.reorderItems(user.id, playlistId, dto);
  }
}
