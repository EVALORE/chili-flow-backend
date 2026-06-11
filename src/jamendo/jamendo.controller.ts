import { Controller, Get, Param, Query, Redirect } from '@nestjs/common';
import { JamendoService } from './jamendo.service';
import { SearchTracksQueryDto } from './dto/search-tracks-query.dto';

@Controller('jamendo')
export class JamendoController {
  constructor(private readonly jamendoService: JamendoService) {}

  @Get('search/tracks')
  searchTracks(@Query() query: SearchTracksQueryDto) {
    return this.jamendoService.searchTracks(query);
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
}
