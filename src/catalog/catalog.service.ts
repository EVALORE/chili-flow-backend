import { Injectable } from '@nestjs/common';
import { AlbumsQueryDto } from '../jamendo/dto/albums-query.dto';
import { ArtistsQueryDto } from '../jamendo/dto/artist-query.dto';
import { AutocompleteQueryDto } from '../jamendo/dto/autocomplete-query.dto';
import { PlaylistsQueryDto } from '../jamendo/dto/playlists-query.dto';
import { SearchTracksQueryDto } from '../jamendo/dto/search-tracks-query.dto';
import { JamendoService } from '../jamendo/jamendo.service';
import { CatalogCacheService } from './catalog-cache.service';

@Injectable()
export class CatalogService {
  constructor(
    private readonly jamendoService: JamendoService,
    private readonly catalogCacheService: CatalogCacheService,
  ) {}

  searchTracks(query: SearchTracksQueryDto) {
    return this.catalogCacheService.getOrSet('searchTracks', query, () =>
      this.jamendoService.searchTracks(query),
    );
  }

  findTrack(id: string) {
    return this.catalogCacheService.getOrSet('findTrack', { id }, () =>
      this.jamendoService.findTrack(id),
    );
  }

  findSimilarTracks(id: string) {
    return this.catalogCacheService.getOrSet('findSimilarTracks', { id }, () =>
      this.jamendoService.findSimilarTracks(id),
    );
  }

  getTrackFileUrl(id: string) {
    return this.jamendoService.getTrackFileUrl(id);
  }

  findAlbums(query: AlbumsQueryDto) {
    return this.catalogCacheService.getOrSet('findAlbums', query, () =>
      this.jamendoService.findAlbums(query),
    );
  }

  findAlbumTracks(id: string) {
    return this.catalogCacheService.getOrSet('findAlbumTracks', { id }, () =>
      this.jamendoService.findAlbumTracks(id),
    );
  }

  findArtists(query: ArtistsQueryDto) {
    return this.catalogCacheService.getOrSet('findArtists', query, () =>
      this.jamendoService.findArtists(query),
    );
  }

  findArtistTracks(id: string) {
    return this.catalogCacheService.getOrSet('findArtistTracks', { id }, () =>
      this.jamendoService.findArtistTracks(id),
    );
  }

  findArtistAlbums(id: string) {
    return this.catalogCacheService.getOrSet('findArtistAlbums', { id }, () =>
      this.jamendoService.findArtistAlbums(id),
    );
  }

  autocomplete(query: AutocompleteQueryDto) {
    return this.catalogCacheService.getOrSet('autocomplete', query, () =>
      this.jamendoService.autocomplete(query),
    );
  }

  findPlaylists(query: PlaylistsQueryDto) {
    return this.catalogCacheService.getOrSet('findPlaylists', query, () =>
      this.jamendoService.findPlaylists(query),
    );
  }

  findPlaylistTracks(id: string) {
    return this.catalogCacheService.getOrSet('findPlaylistTracks', { id }, () =>
      this.jamendoService.findPlaylistTracks(id),
    );
  }
}
