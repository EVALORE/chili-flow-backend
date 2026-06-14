import { Injectable } from '@nestjs/common';
import { AlbumsQueryDto } from '../jamendo/dto/albums-query.dto';
import { ArtistsQueryDto } from '../jamendo/dto/artist-query.dto';
import { AutocompleteQueryDto } from '../jamendo/dto/autocomplete-query.dto';
import { PlaylistsQueryDto } from '../jamendo/dto/playlists-query.dto';
import { SearchTracksQueryDto } from '../jamendo/dto/search-tracks-query.dto';
import { JamendoService } from '../jamendo/jamendo.service';

@Injectable()
export class CatalogService {
  constructor(private readonly jamendoService: JamendoService) {}

  searchTracks(query: SearchTracksQueryDto) {
    return this.jamendoService.searchTracks(query);
  }

  findTrack(id: string) {
    return this.jamendoService.findTrack(id);
  }

  findSimilarTracks(id: string) {
    return this.jamendoService.findSimilarTracks(id);
  }

  getTrackFileUrl(id: string) {
    return this.jamendoService.getTrackFileUrl(id);
  }

  findAlbums(query: AlbumsQueryDto) {
    return this.jamendoService.findAlbums(query);
  }

  findAlbumTracks(id: string) {
    return this.jamendoService.findAlbumTracks(id);
  }

  findArtists(query: ArtistsQueryDto) {
    return this.jamendoService.findArtists(query);
  }

  findArtistTracks(id: string) {
    return this.jamendoService.findArtistTracks(id);
  }

  findArtistAlbums(id: string) {
    return this.jamendoService.findArtistAlbums(id);
  }

  autocomplete(query: AutocompleteQueryDto) {
    return this.jamendoService.autocomplete(query);
  }

  findPlaylists(query: PlaylistsQueryDto) {
    return this.jamendoService.findPlaylists(query);
  }

  findPlaylistTracks(id: string) {
    return this.jamendoService.findPlaylistTracks(id);
  }
}
