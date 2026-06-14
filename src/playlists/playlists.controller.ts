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
import { AddPlaylistTrackDto } from './dto/add-playlist-track.dto';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { ReorderPlaylistTracksDto } from './dto/reorder-playlist-tracks.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PlaylistsService } from './playlists.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('playlists')
@ApiBearerAuth('bearer')
@Controller('playlists')
@UseGuards(JwtAuthGuard)
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.playlistsService.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlaylistDto,
  ) {
    return this.playlistsService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.playlistsService.findOne(user.id, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(user.id, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.playlistsService.delete(user.id, id);
  }

  @Post(':id/tracks')
  addTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddPlaylistTrackDto,
  ) {
    return this.playlistsService.addTrack(user.id, id, dto);
  }

  @Delete(':id/tracks/:trackId')
  removeTrack(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('trackId') trackId: string,
  ) {
    return this.playlistsService.removeTrack(user.id, id, trackId);
  }

  @Put(':id/tracks/reorder')
  reorderTracks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReorderPlaylistTracksDto,
  ) {
    return this.playlistsService.reorderTracks(user.id, id, dto);
  }
}
