import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlaylistsRepository } from './playlists.repository';
import { TracksService } from '../tracks/tracks.service';
import { JamendoService } from '../jamendo/jamendo.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { TrackSource } from '../../prisma/generated/enums';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddPlaylistTrackDto } from './dto/add-playlist-track.dto';
import { ReorderPlaylistTracksDto } from './dto/reorder-playlist-tracks.dto';

@Injectable()
export class PlaylistsService {
  constructor(
    private readonly playlistsRepository: PlaylistsRepository,
    private readonly tracksService: TracksService,
    private readonly jamendoService: JamendoService,
  ) {}

  async list(ownerId: string) {
    const playlists = await this.playlistsRepository.findManyByOwner(ownerId);

    return playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      trackCount: playlist.tracks.length,
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

    return {
      ...playlist,
      trackCount: playlist.tracks.length,
      totalDuration: playlist.tracks.reduce(
        (sum, track) => sum + (track.duration ?? 0),
        0,
      ),
      tracks: playlist.tracks.map((track) => ({
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

  async addTrack(
    ownerId: string,
    playlistId: string,
    dto: AddPlaylistTrackDto,
  ) {
    const playlist = await this._findOwnedPlaylist(ownerId, playlistId);

    if (dto.source === 'uploaded') {
      const track = await this.tracksService.findOwnedTrack(
        ownerId,
        dto.sourceId,
      );

      await this.playlistsRepository.addTrack(playlist.id, {
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

      await this.playlistsRepository.addTrack(playlist.id, {
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

  async removeTrack(ownerId: string, playlistId: string, trackId: string) {
    const playlist = await this._findOwnedPlaylist(ownerId, playlistId);
    const removed = await this.playlistsRepository.removeTrack(
      playlist.id,
      trackId,
    );

    if (!removed) {
      throw new NotFoundException('Playlist track not found');
    }

    return this.findOne(ownerId, playlist.id);
  }

  async reorderTracks(
    ownerId: string,
    playlistId: string,
    dto: ReorderPlaylistTracksDto,
  ) {
    const playlist = await this._findOwnedPlaylist(ownerId, playlistId);
    const currentIds = playlist.tracks.map((track) => track.id);
    const submittedIds = new Set(dto.trackIds);

    if (submittedIds.size !== dto.trackIds.length) {
      throw new BadRequestException('Track IDs must be unique');
    }

    if (
      currentIds.length !== dto.trackIds.length ||
      currentIds.some((id) => !submittedIds.has(id))
    ) {
      throw new BadRequestException('Track IDs must match the playlist tracks');
    }

    await this.playlistsRepository.reorderTracks(playlist.id, dto.trackIds);

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
