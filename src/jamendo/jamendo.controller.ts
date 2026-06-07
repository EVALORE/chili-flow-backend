import { Controller, Get, Param, Query } from '@nestjs/common';
import { JamendoService } from './jamendo.service';
import { SearchTRacksQueryDto } from './dto/search-tracks-query.dto';

@Controller('jamendo')
export class JamendoController {
  constructor(private readonly jamendoService: JamendoService) {}

  @Get('search/tracks')
  searchTracks(@Query() query: SearchTRacksQueryDto) {
    return this.jamendoService.searchTracks(query);
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
