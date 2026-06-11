import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JamendoClient } from './jamendo.client';
import { SearchTracksQueryDto } from './dto/search-tracks-query.dto';
import { JamendoAlbum, JamendoAlbumTrack, JamendoTrack } from './jamendo.types';
import {
  mapJamendoAlbum,
  mapJamendoAlbumWithTracks,
  mapJamendoTrack,
} from './jamendo.mapper';
import { AlbumsQueryDto } from './dto/albums-query.dto';

@Injectable()
export class JamendoService {
  constructor(private readonly jamendoClient: JamendoClient) {}

  async searchTracks({ limit, search, offset }: SearchTracksQueryDto) {
    const response = await this.jamendoClient.get<JamendoTrack>('/tracks', {
      search,
      limit,
      offset,
      include: 'musicinfo',
    });

    return {
      count: response.headers.results_count,
      results: response.results.map(mapJamendoTrack),
    };
  }

  async findTrack(id: string) {
    const response = await this.jamendoClient.get<JamendoTrack>('/tracks', {
      id,
      include: 'musicinfo',
    });

    return response.results[0] ? mapJamendoTrack(response.results[0]) : null;
  }

  async findSimilarTracks(id: string) {
    const response = await this.jamendoClient.get<JamendoTrack>(
      '/tracks/similar',
      { id },
    );

    return response.results.map(mapJamendoTrack);
  }

  async getTrackFileUrl(id: string) {
    const track = await this.findTrack(id);

    if (!track) {
      throw new NotFoundException('Jamendo track not found');
    }

    if (!track.audiodownloadAllowed) {
      throw new BadRequestException('Jamendo track download is not allowed');
    }

    return this.jamendoClient.getRedirectUrl('/tracks/file', {
      id,
      action: 'download',
      audioformat: 'mp32',
    });
  }

  async findAlbums({
    limit,
    offset,
    search,
    artistId,
    artistName,
    type,
  }: AlbumsQueryDto) {
    const response = await this.jamendoClient.get<JamendoAlbum>('/albums', {
      limit,
      offset,
      namesearch: search,
      artist_id: artistId,
      artist_name: artistName,
      type,
      imagesize: 300,
    });

    return {
      count: response.headers.results_count,
      results: response.results.map(mapJamendoAlbum),
    };
  }

  async findAlbumTracks(id: string) {
    const response = await this.jamendoClient.get<JamendoAlbumTrack>(
      '/albums/tracks',
      {
        id,
        limit: 1,
        imagesize: 300,
        audioformat: 'mp32',
        audiodlformat: 'mp32',
      },
    );

    if (!response.results[0]) {
      throw new NotFoundException('Jamendo album not found');
    }

    return mapJamendoAlbumWithTracks(response.results[0]);
  }
}
