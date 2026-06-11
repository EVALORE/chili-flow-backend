import { Controller, Get, Param, Query, Redirect } from '@nestjs/common';
import { JamendoService } from './jamendo.service';
import { SearchTracksQueryDto } from './dto/search-tracks-query.dto';
import { AlbumsQueryDto } from './dto/albums-query.dto';
import { ArtistsQueryDto } from './dto/artist-query.dto';
import { AutocompleteQueryDto } from './dto/autocomplete-query.dto';

@Controller('jamendo')
export class JamendoController {
  constructor(private readonly jamendoService: JamendoService) {}

  @Get('search/tracks')
  searchTracks(@Query() query: SearchTracksQueryDto) {
    return this.jamendoService.searchTracks(query);
  }

  @Get('albums')
  findAlbums(@Query() query: AlbumsQueryDto) {
    return this.jamendoService.findAlbums(query);
  }

  @Get('albums/:id/tracks')
  findAlbumTracks(@Param('id') id: string) {
    return this.jamendoService.findAlbumTracks(id);
  }

  @Get('tracks/:id/file')
  @Redirect(undefined, 302)
  async getTrackFile(@Param('id') id: string) {
    const url = await this.jamendoService.getTrackFileUrl(id);

    return { url };
  }

  @Get('tracks/:id')
  findTrack(@Param('id') id: string) {
    return this.jamendoService.findTrack(id);
  }

  @Get('tracks/:id/similar')
  findSimilarTracks(@Param('id') id: string) {
    return this.jamendoService.findSimilarTracks(id);
  }

  @Get('artists')
  findArtists(@Query() query: ArtistsQueryDto) {
    return this.jamendoService.findArtists(query);
  }

  @Get('artists/:id/tracks')
  findArtistTracks(@Param('id') id: string) {
    return this.jamendoService.findArtistTracks(id);
  }

  @Get('artists/:id/albums')
  findArtistAlbums(@Param('id') id: string) {
    return this.jamendoService.findArtistAlbums(id);
  }

  @Get('autocomplete')
  autocomplete(@Query() query: AutocompleteQueryDto) {
    return this.jamendoService.autocomplete(query);
  }
}
