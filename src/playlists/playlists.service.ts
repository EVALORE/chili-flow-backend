import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlaylistsRepository } from './playlists.repository';
import { UploadedTracksService } from '../uploaded-tracks/uploaded-tracks.service';
import { JamendoService } from '../jamendo/jamendo.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { TrackSource } from '../../prisma/generated/enums';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { CreatePlaylistItemDto } from './dto/create-playlist-item.dto';
import { ReorderPlaylistItemsDto } from './dto/reorder-playlist-items.dto';

@Injectable()
export class PlaylistsService {
  constructor(
    private readonly playlistsRepository: PlaylistsRepository,
    private readonly uploadedTracksService: UploadedTracksService,
    private readonly jamendoService: JamendoService,
  ) {}

  async list(ownerId: string) {
    const playlists = await this.playlistsRepository.findManyByOwner(ownerId);

    return playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      itemCount: playlist.tracks.length,
      totalDuration: playlist.tracks.reduce(
        (sum, track) => sum + (track.duration ?? 0),
        0,
      ),
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    }));
  }

  async create(ownerId: string, dto: CreatePlaylistDto) {
    return this.playlistsRepository.create(ownerId, {
      name: dto.name.trim(),
      description: dto.description?.trim() || undefined,
    });
  }

  async findOne(ownerId: string, id: string) {
    const playlist = await this._findOwnedPlaylist(ownerId, id);
    const { tracks, ...playlistFields } = playlist;

    return {
      ...playlistFields,
      itemCount: tracks.length,
      totalDuration: tracks.reduce(
        (sum, track) => sum + (track.duration ?? 0),
        0,
      ),
      items: tracks.map((track) => ({
        ...track,
        source: track.source === TrackSource.JAMENDO ? 'jamendo' : 'uploaded',
      })),
    };
  }

  async update(ownerId: string, id: string, dto: UpdatePlaylistDto) {
    await this._findOwnedPlaylist(ownerId, id);
    return this.playlistsRepository.updateById(id, {
      name: dto.name?.trim(),
      description: dto.description?.trim() || undefined,
    });
  }

  async delete(ownerId: string, id: string) {
    const playlist = await this._findOwnedPlaylist(ownerId, id);
    await this.playlistsRepository.deleteById(playlist.id);

    return { deleted: true };
  }

  async createItem(
    ownerId: string,
    playlistId: string,
    dto: CreatePlaylistItemDto,
  ) {
    const playlist = await this._findOwnedPlaylist(ownerId, playlistId);

    if (dto.source === 'uploaded') {
      const track = await this.uploadedTracksService.findOwnedUploadedTrack(
        ownerId,
        dto.sourceId,
      );

      await this.playlistsRepository.addItem(playlist.id, {
        source: TrackSource.UPLOADED,
        sourceId: track.id,
        title: track.title,
        artist: track.artist,
        audioUrl: track.publicUrl,
        duration: track.duration,
      });
    } else {
      const track = await this.jamendoService.findTrack(dto.sourceId);

      if (!track) {
        throw new NotFoundException('Jamendo track not found');
      }

      await this.playlistsRepository.addItem(playlist.id, {
        source: TrackSource.JAMENDO,
        sourceId: track.sourceId,
        title: track.title,
        artist: track.artist,
        coverUrl: track.coverUrl,
        audioUrl: track.audioUrl,
        duration: track.duration,
      });
    }

    return this.findOne(ownerId, playlist.id);
  }

  async removeItem(
    ownerId: string,
    playlistId: string,
    playlistItemId: string,
  ) {
    const playlist = await this._findOwnedPlaylist(ownerId, playlistId);
    const removed = await this.playlistsRepository.removeItem(
      playlist.id,
      playlistItemId,
    );

    if (!removed) {
      throw new NotFoundException('Playlist item not found');
    }

    return this.findOne(ownerId, playlist.id);
  }

  async reorderItems(
    ownerId: string,
    playlistId: string,
    dto: ReorderPlaylistItemsDto,
  ) {
    const playlist = await this._findOwnedPlaylist(ownerId, playlistId);
    const currentIds = playlist.tracks.map((track) => track.id);
    const submittedIds = new Set(dto.playlistItemIds);

    if (submittedIds.size !== dto.playlistItemIds.length) {
      throw new BadRequestException('Playlist item IDs must be unique');
    }

    if (
      currentIds.length !== dto.playlistItemIds.length ||
      currentIds.some((id) => !submittedIds.has(id))
    ) {
      throw new BadRequestException(
        'Playlist item IDs must match the playlist items',
      );
    }

    await this.playlistsRepository.reorderItems(
      playlist.id,
      dto.playlistItemIds,
    );

    return this.findOne(ownerId, playlist.id);
  }

  private async _findOwnedPlaylist(ownerId: string, id: string) {
    const playlist = await this.playlistsRepository.findOwnedById(ownerId, id);

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    return playlist;
  }
}
