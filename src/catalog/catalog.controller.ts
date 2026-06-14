import { Controller, Get, Param, Query, Redirect } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AlbumsQueryDto } from '../jamendo/dto/albums-query.dto';
import { ArtistsQueryDto } from '../jamendo/dto/artist-query.dto';
import { AutocompleteQueryDto } from '../jamendo/dto/autocomplete-query.dto';
import { PlaylistsQueryDto } from '../jamendo/dto/playlists-query.dto';
import { SearchTracksQueryDto } from '../jamendo/dto/search-tracks-query.dto';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('search/tracks')
  searchTracks(@Query() query: SearchTracksQueryDto) {
    return this.catalogService.searchTracks(query);
  }

  @Get('albums')
  findAlbums(@Query() query: AlbumsQueryDto) {
    return this.catalogService.findAlbums(query);
  }

  @Get('albums/:id/tracks')
  findAlbumTracks(@Param('id') id: string) {
    return this.catalogService.findAlbumTracks(id);
  }

  @Get('tracks/:id/file')
  @Redirect(undefined, 302)
  async getTrackFile(@Param('id') id: string) {
    const url = await this.catalogService.getTrackFileUrl(id);

    return { url };
  }

  @Get('tracks/:id')
  findTrack(@Param('id') id: string) {
    return this.catalogService.findTrack(id);
  }

  @Get('tracks/:id/similar')
  findSimilarTracks(@Param('id') id: string) {
    return this.catalogService.findSimilarTracks(id);
  }

  @Get('artists')
  findArtists(@Query() query: ArtistsQueryDto) {
    return this.catalogService.findArtists(query);
  }

  @Get('artists/:id/tracks')
  findArtistTracks(@Param('id') id: string) {
    return this.catalogService.findArtistTracks(id);
  }

  @Get('artists/:id/albums')
  findArtistAlbums(@Param('id') id: string) {
    return this.catalogService.findArtistAlbums(id);
  }

  @Get('autocomplete')
  autocomplete(@Query() query: AutocompleteQueryDto) {
    return this.catalogService.autocomplete(query);
  }

  @Get('playlists')
  findPlaylists(@Query() query: PlaylistsQueryDto) {
    return this.catalogService.findPlaylists(query);
  }

  @Get('playlists/:id/tracks')
  findPlaylistTracks(@Param('id') id: string) {
    return this.catalogService.findPlaylistTracks(id);
  }
}
