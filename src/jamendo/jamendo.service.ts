import { Injectable } from '@nestjs/common';
import { JamendoClient } from './jamendo.client';
import { SearchTRacksQueryDto } from './dto/search-tracks-query.dto';
import { JamendoTrack } from './jamendo.types';
import { mapJamendoTrack } from './jamendo.mapper';

@Injectable()
export class JamendoService {
  constructor(private readonly jamendoClient: JamendoClient) {}

  async searchTracks({ limit, search, offset }: SearchTRacksQueryDto) {
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
}
