import {
  Controller,
  Get,
  Param,
  Query,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
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
import { CatalogRateLimitGuard } from './catalog-rate-limit.guard';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@ApiExtraModels(CatalogTrackResponseDto)
@UseGuards(CatalogRateLimitGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('tracks')
  @ApiOperation({
    summary: 'Search catalog tracks',
    description:
      'Searches external Jamendo catalog tracks. Returned IDs are Jamendo catalog track IDs, not local uploaded-track IDs.',
  })
  @ApiOkResponse({ type: CatalogTrackListResponseDto })
  searchTracks(@Query() query: SearchTracksQueryDto) {
    return this.catalogService.searchTracks(query);
  }

  @Get('albums')
  @ApiOperation({
    summary: 'Search catalog albums',
    description: 'Searches external Jamendo catalog albums.',
  })
  @ApiOkResponse({ type: CatalogAlbumListResponseDto })
  findAlbums(@Query() query: AlbumsQueryDto) {
    return this.catalogService.findAlbums(query);
  }

  @Get('albums/:catalogAlbumId/tracks')
  @ApiOperation({
    summary: 'Get catalog album tracks',
    description:
      'Returns tracks for one external Jamendo catalog album. Path IDs are Jamendo catalog IDs.',
  })
  @ApiParam({
    name: 'catalogAlbumId',
    description: 'Jamendo catalog album ID.',
  })
  @ApiOkResponse({ type: CatalogAlbumWithTracksResponseDto })
  findAlbumTracks(@Param('catalogAlbumId') catalogAlbumId: string) {
    return this.catalogService.findAlbumTracks(catalogAlbumId);
  }

  @Get('tracks/:catalogTrackId/file')
  @Redirect(undefined, 302)
  @ApiOperation({
    summary: 'Get catalog track file',
    description:
      'Redirects to the external Jamendo track file URL for a Jamendo catalog track ID.',
  })
  @ApiParam({
    name: 'catalogTrackId',
    description: 'Jamendo catalog track ID.',
  })
  @ApiFoundResponse({ description: 'Redirects to the Jamendo track file URL.' })
  async getTrackFile(@Param('catalogTrackId') catalogTrackId: string) {
    const url = await this.catalogService.getTrackFileUrl(catalogTrackId);

    return { url };
  }

  @Get('tracks/:catalogTrackId')
  @ApiOperation({
    summary: 'Get catalog track',
    description:
      'Returns one external Jamendo catalog track by Jamendo catalog track ID.',
  })
  @ApiParam({
    name: 'catalogTrackId',
    description: 'Jamendo catalog track ID.',
  })
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CatalogTrackResponseDto) },
        { type: 'null' },
      ],
    },
  })
  findTrack(@Param('catalogTrackId') catalogTrackId: string) {
    return this.catalogService.findTrack(catalogTrackId);
  }

  @Get('tracks/:catalogTrackId/similar')
  @ApiOperation({
    summary: 'Get similar catalog tracks',
    description:
      'Returns external Jamendo catalog tracks similar to one Jamendo catalog track.',
  })
  @ApiParam({
    name: 'catalogTrackId',
    description: 'Jamendo catalog track ID.',
  })
  @ApiOkResponse({ type: CatalogTrackResponseDto, isArray: true })
  findSimilarTracks(@Param('catalogTrackId') catalogTrackId: string) {
    return this.catalogService.findSimilarTracks(catalogTrackId);
  }

  @Get('artists')
  @ApiOperation({
    summary: 'Search catalog artists',
    description: 'Searches external Jamendo catalog artists.',
  })
  @ApiOkResponse({ type: CatalogArtistListResponseDto })
  findArtists(@Query() query: ArtistsQueryDto) {
    return this.catalogService.findArtists(query);
  }

  @Get('artists/:catalogArtistId/tracks')
  @ApiOperation({
    summary: 'Get catalog artist tracks',
    description:
      'Returns external Jamendo catalog tracks for one Jamendo catalog artist.',
  })
  @ApiParam({
    name: 'catalogArtistId',
    description: 'Jamendo catalog artist ID.',
  })
  @ApiOkResponse({ type: CatalogTrackListResponseDto })
  findArtistTracks(@Param('catalogArtistId') catalogArtistId: string) {
    return this.catalogService.findArtistTracks(catalogArtistId);
  }

  @Get('artists/:catalogArtistId/albums')
  @ApiOperation({
    summary: 'Get catalog artist albums',
    description:
      'Returns external Jamendo catalog albums for one Jamendo catalog artist.',
  })
  @ApiParam({
    name: 'catalogArtistId',
    description: 'Jamendo catalog artist ID.',
  })
  @ApiOkResponse({ type: CatalogAlbumListResponseDto })
  findArtistAlbums(@Param('catalogArtistId') catalogArtistId: string) {
    return this.catalogService.findArtistAlbums(catalogArtistId);
  }

  @Get('autocomplete')
  @ApiOperation({
    summary: 'Autocomplete catalog search',
    description:
      'Returns external Jamendo catalog autocomplete suggestions for tracks, albums, artists, and tags.',
  })
  @ApiOkResponse({ type: CatalogAutocompleteResponseDto })
  autocomplete(@Query() query: AutocompleteQueryDto) {
    return this.catalogService.autocomplete(query);
  }

  @Get('playlists')
  @ApiOperation({
    summary: 'Search catalog playlists',
    description: 'Searches external Jamendo catalog playlists.',
  })
  @ApiOkResponse({ type: CatalogPlaylistListResponseDto })
  findPlaylists(@Query() query: PlaylistsQueryDto) {
    return this.catalogService.findPlaylists(query);
  }

  @Get('playlists/:catalogPlaylistId/tracks')
  @ApiOperation({
    summary: 'Get catalog playlist tracks',
    description:
      'Returns external Jamendo catalog tracks for one Jamendo catalog playlist.',
  })
  @ApiParam({
    name: 'catalogPlaylistId',
    description: 'Jamendo catalog playlist ID.',
  })
  @ApiOkResponse({ type: CatalogPlaylistWithTracksResponseDto })
  findPlaylistTracks(@Param('catalogPlaylistId') catalogPlaylistId: string) {
    return this.catalogService.findPlaylistTracks(catalogPlaylistId);
  }
}
