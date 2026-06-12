import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RecentlyPlayedRepository } from './recently-played.repository';
import { TracksService } from '../tracks/tracks.service';
import { JamendoService } from '../jamendo/jamendo.service';
import { CreateRecentlyPlayedDto } from './dto/create-recently-played.dto';
import { TrackSource } from '../../prisma/generated/enums';
import { RecentlyPlayedModel } from '../../prisma/generated/models';
import { RecentlyPlayedQueryDto } from './dto/recently-played-query.dto';

@Injectable()
export class RecentlyPlayedService {
  constructor(
    private readonly recentlyPlayedRepository: RecentlyPlayedRepository,
    private readonly tracksService: TracksService,
    private readonly jamendoService: JamendoService,
  ) {}

  async create(ownerId: string, dto: CreateRecentlyPlayedDto) {
    if (dto.source === 'uploaded') {
      const track = await this.tracksService.findOwnedTrack(
        ownerId,
        dto.sourceId,
      );

      const item = await this.recentlyPlayedRepository.create({
        ownerId,
        source: TrackSource.UPLOADED,
        sourceId: track.id,
        title: track.title,
        artist: track.artist,
        coverUrl: null,
        audioUrl: track.publicUrl,
        duration: track.duration,
      });

      return this._toResponse(item);
    }

    const track = await this.jamendoService.findTrack(dto.sourceId);

    if (!track) {
      throw new NotFoundException('Jamendo track not found');
    }

    const item = await this.recentlyPlayedRepository.create({
      ownerId,
      source: TrackSource.JAMENDO,
      sourceId: track.sourceId,
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl,
      audioUrl: track.audioUrl,
      duration: track.duration,
    });

    return this._toResponse(item);
  }

  async list(ownerId: string, query: RecentlyPlayedQueryDto) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    if (from && to && from > to) {
      throw new BadRequestException('from must be before to');
    }

    const items = await this.recentlyPlayedRepository.findManyByOwner(ownerId, {
      limit: query.limit,
      offset: query.offset,
      from,
      to,
    });

    return items.map((item) => this._toResponse(item));
  }

  private _toResponse(item: RecentlyPlayedModel) {
    return {
      id: item.id,
      source: item.source === TrackSource.JAMENDO ? 'jamendo' : 'uploaded',
      sourceId: item.sourceId,
      title: item.title,
      artist: item.artist,
      coverUrl: item.coverUrl,
      audioUrl: item.audioUrl,
      duration: item.duration,
      playedAt: item.playedAt,
    };
  }
}
