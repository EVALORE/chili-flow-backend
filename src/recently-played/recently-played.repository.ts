import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TrackSource } from '../../prisma/generated/enums';

@Injectable()
export class RecentlyPlayedRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    ownerId: string;
    source: typeof TrackSource.JAMENDO | typeof TrackSource.UPLOADED;
    sourceId: string;
    title: string;
    artist: string;
    coverUrl?: string | null;
    audioUrl?: string | null;
    duration?: number | null;
  }) {
    return this.prisma.recentlyPlayed.create({ data });
  }

  findManyByOwner(
    ownerId: string,
    options: {
      limit: number;
      offset: number;
      from?: Date;
      to?: Date;
    },
  ) {
    const playedAt =
      options.from || options.to
        ? {
            ...(options.from ? { gte: options.from } : {}),
            ...(options.to ? { lte: options.to } : {}),
          }
        : undefined;

    return this.prisma.recentlyPlayed.findMany({
      where: {
        ownerId,
        ...(playedAt ? { playedAt } : {}),
      },
      orderBy: { playedAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    });
  }
}
