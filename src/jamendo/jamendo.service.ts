import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JamendoClient } from './jamendo.client';
import { SearchTracksQueryDto } from './dto/search-tracks-query.dto';
import { JamendoTrack } from './jamendo.types';
import { mapJamendoTrack } from './jamendo.mapper';

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
}
