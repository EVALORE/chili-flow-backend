import { Controller, Get, Param, Query, Redirect } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiFoundResponse,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { AlbumsQueryDto } from '../jamendo/dto/albums-query.dto';
import { ArtistsQueryDto } from '../jamendo/dto/artist-query.dto';
import { AutocompleteQueryDto } from '../jamendo/dto/autocomplete-query.dto';
import { PlaylistsQueryDto } from '../jamendo/dto/playlists-query.dto';
import { SearchTracksQueryDto } from '../jamendo/dto/search-tracks-query.dto';
import {
  CatalogAlbumListResponseDto,
  CatalogAlbumWithTracksResponseDto,
  CatalogArtistListResponseDto,
  CatalogAutocompleteResponseDto,
  CatalogPlaylistListResponseDto,
  CatalogPlaylistWithTracksResponseDto,
  CatalogTrackListResponseDto,
  CatalogTrackResponseDto,
} from './dto/catalog-response.dto';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@ApiExtraModels(CatalogTrackResponseDto)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('search/tracks')
  @ApiOkResponse({ type: CatalogTrackListResponseDto })
  searchTracks(@Query() query: SearchTracksQueryDto) {
    return this.catalogService.searchTracks(query);
  }

  @Get('albums')
  @ApiOkResponse({ type: CatalogAlbumListResponseDto })
  findAlbums(@Query() query: AlbumsQueryDto) {
    return this.catalogService.findAlbums(query);
  }

  @Get('albums/:id/tracks')
  @ApiOkResponse({ type: CatalogAlbumWithTracksResponseDto })
  findAlbumTracks(@Param('id') id: string) {
    return this.catalogService.findAlbumTracks(id);
  }

  @Get('tracks/:id/file')
  @Redirect(undefined, 302)
  @ApiFoundResponse({ description: 'Redirects to the Jamendo track file URL.' })
  async getTrackFile(@Param('id') id: string) {
    const url = await this.catalogService.getTrackFileUrl(id);

    return { url };
  }

  @Get('tracks/:id')
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CatalogTrackResponseDto) },
        { type: 'null' },
      ],
    },
  })
  findTrack(@Param('id') id: string) {
    return this.catalogService.findTrack(id);
  }

  @Get('tracks/:id/similar')
  @ApiOkResponse({ type: CatalogTrackResponseDto, isArray: true })
  findSimilarTracks(@Param('id') id: string) {
    return this.catalogService.findSimilarTracks(id);
  }

  @Get('artists')
  @ApiOkResponse({ type: CatalogArtistListResponseDto })
  findArtists(@Query() query: ArtistsQueryDto) {
    return this.catalogService.findArtists(query);
  }

  @Get('artists/:id/tracks')
  @ApiOkResponse({ type: CatalogTrackListResponseDto })
  findArtistTracks(@Param('id') id: string) {
    return this.catalogService.findArtistTracks(id);
  }

  @Get('artists/:id/albums')
  @ApiOkResponse({ type: CatalogAlbumListResponseDto })
  findArtistAlbums(@Param('id') id: string) {
    return this.catalogService.findArtistAlbums(id);
  }

  @Get('autocomplete')
  @ApiOkResponse({ type: CatalogAutocompleteResponseDto })
  autocomplete(@Query() query: AutocompleteQueryDto) {
    return this.catalogService.autocomplete(query);
  }

  @Get('playlists')
  @ApiOkResponse({ type: CatalogPlaylistListResponseDto })
  findPlaylists(@Query() query: PlaylistsQueryDto) {
    return this.catalogService.findPlaylists(query);
  }

  @Get('playlists/:id/tracks')
  @ApiOkResponse({ type: CatalogPlaylistWithTracksResponseDto })
  findPlaylistTracks(@Param('id') id: string) {
    return this.catalogService.findPlaylistTracks(id);
  }
}
