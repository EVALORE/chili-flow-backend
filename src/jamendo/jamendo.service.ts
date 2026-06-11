import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JamendoClient } from './jamendo.client';
import { SearchTracksQueryDto } from './dto/search-tracks-query.dto';
import {
  JamendoAlbum,
  JamendoAlbumTrack,
  JamendoArtist,
  JamendoAutocompleteResults,
  JamendoPlaylist,
  JamendoPlaylistTrack,
  JamendoTrack,
} from './jamendo.types';
import {
  mapJamendoAlbum,
  mapJamendoAlbumWithTracks,
  mapJamendoArtist,
  mapJamendoAutocompleteMatch,
  mapJamendoPlaylist,
  mapJamendoPlaylistWithTracks,
  mapJamendoTrack,
} from './jamendo.mapper';
import { AlbumsQueryDto } from './dto/albums-query.dto';
import { ArtistsQueryDto } from './dto/artist-query.dto';
import { AutocompleteQueryDto } from './dto/autocomplete-query.dto';
import { PlaylistsQueryDto } from './dto/playlists-query.dto';

@Injectable()
export class JamendoService {
  constructor(private readonly jamendoClient: JamendoClient) {}

  async searchTracks({
    limit,
    search,
    offset,
    tags,
    fuzzyTags,
    type,
    order,
  }: SearchTracksQueryDto) {
    const response = await this.jamendoClient.get<JamendoTrack[]>('/tracks', {
      search,
      limit,
      offset,
      'tags[]': tags,
      'fuzzytags[]': fuzzyTags,
      'type[]': type,
      order,
      include: 'musicinfo',
      audioformat: 'mp32',
      audiodlformat: 'mp32s',
    });

    return {
      count: response.headers.results_count,
      results: response.results.map(mapJamendoTrack),
    };
  }

  async findTrack(id: string) {
    const response = await this.jamendoClient.get<JamendoTrack[]>('/tracks', {
      id,
      include: 'musicinfo',
    });

    return response.results[0] ? mapJamendoTrack(response.results[0]) : null;
  }

  async findSimilarTracks(id: string) {
    const response = await this.jamendoClient.get<JamendoTrack[]>(
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
    const response = await this.jamendoClient.get<JamendoAlbum[]>('/albums', {
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
    const response = await this.jamendoClient.get<JamendoAlbumTrack[]>(
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

  async findArtists({ limit, offset, search }: ArtistsQueryDto) {
    const response = await this.jamendoClient.get<JamendoArtist[]>('/artists', {
      limit,
      offset,
      namesearch: search,
      imagesize: 300,
    });

    return {
      count: response.headers.results_count,
      results: response.results.map(mapJamendoArtist),
    };
  }

  async findArtistTracks(id: string) {
    const response = await this.jamendoClient.get<JamendoTrack[]>(
      '/artists/tracks',
      {
        id,
        include: 'musicinfo',
        imagesize: 300,
        audioformat: 'mp32',
        audiodlformat: 'mp32',
      },
    );

    return {
      count: response.headers.results_count,
      results: response.results.map(mapJamendoTrack),
    };
  }

  async findArtistAlbums(id: string) {
    const response = await this.jamendoClient.get<JamendoAlbum[]>(
      '/artists/albums',
      {
        id,
        imagesize: 300,
      },
    );

    return {
      count: response.headers.results_count,
      results: response.results.map(mapJamendoAlbum),
    };
  }

  async autocomplete({ prefix, limit, entity }: AutocompleteQueryDto) {
    const response = await this.jamendoClient.get<JamendoAutocompleteResults>(
      '/autocomplete',
      {
        prefix,
        limit,
        'entity[]': entity,
        matchcount: true,
      },
    );

    return {
      tracks: (response.results.tracks ?? []).map(mapJamendoAutocompleteMatch),
      albums: (response.results.albums ?? []).map(mapJamendoAutocompleteMatch),
      artists: (response.results.artists ?? []).map(
        mapJamendoAutocompleteMatch,
      ),
      tags: (response.results.tags ?? []).map(mapJamendoAutocompleteMatch),
    };
  }

  async findPlaylists({ limit, offset, search }: PlaylistsQueryDto) {
    const response = await this.jamendoClient.get<JamendoPlaylist[]>(
      '/playlists',
      {
        limit,
        offset,
        namesearch: search,
        imagesize: 300,
      },
    );

    return {
      count: response.headers.results_count,
      results: response.results.map(mapJamendoPlaylist),
    };
  }

  async findPlaylistTracks(id: string) {
    const response = await this.jamendoClient.get<JamendoPlaylistTrack[]>(
      '/playlists/tracks',
      {
        id,
        limit: 1,
        imagesize: 300,
        audioforamt: 'mp32',
        audiodlformat: 'mp32',
        include: 'musicinfo',
      },
    );

    if (!response.results[0]) {
      throw new NotFoundException('Jamendo playlist not found');
    }

    return mapJamendoPlaylistWithTracks(response.results[0]);
  }
}
