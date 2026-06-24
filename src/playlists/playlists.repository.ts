import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TrackSource } from '../../prisma/generated/enums';

@Injectable()
export class PlaylistsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, data: { name: string; description?: string }) {
    return this.prisma.playlist.create({ data: { ownerId, ...data } });
  }

  findManyByOwner(ownerId: string) {
    return this.prisma.playlist.findMany({
      where: { ownerId },
      include: { tracks: { select: { duration: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOwnedById(ownerId: string, id: string) {
    return this.prisma.playlist.findFirst({
      where: { id, ownerId },
      include: { tracks: { orderBy: { position: 'asc' } } },
    });
  }

  updateById(id: string, data: { name?: string; description?: string }) {
    return this.prisma.playlist.update({ where: { id }, data });
  }

  deleteById(id: string) {
    return this.prisma.playlist.delete({ where: { id } });
  }

  async addItem(
    playlistId: string,
    data: {
      source: typeof TrackSource.JAMENDO | typeof TrackSource.UPLOADED;
      sourceId: string;
      title: string;
      artist: string;
      coverUrl?: string | null;
      audioUrl?: string | null;
      duration?: number | null;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT "id"
        FROM "Playlist"
        WHERE "id" = ${playlistId}
        FOR UPDATE
      `;

      const { _max } = await tx.playlistTrack.aggregate({
        where: { playlistId },
        _max: { position: true },
      });
      const position = (_max.position ?? -1) + 1;

      return tx.playlistTrack.create({
        data: { playlistId, position, ...data },
      });
    });
  }

  async removeItem(playlistId: string, playlistItemId: string) {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.playlistTrack.deleteMany({
        where: { id: playlistItemId, playlistId },
      });

      if (result.count === 0) {
        return false;
      }

      const tracks = await tx.playlistTrack.findMany({
        where: { playlistId },
        orderBy: { position: 'asc' },
      });

      const temporaryOffset =
        Math.max(...tracks.map((track) => track.position), -1) + 1;

      await Promise.all(
        tracks.map((track, index) =>
          tx.playlistTrack.update({
            where: { id: track.id },
            data: { position: index + temporaryOffset },
          }),
        ),
      );

      await Promise.all(
        tracks.map((track, index) =>
          tx.playlistTrack.update({
            where: { id: track.id },
            data: { position: index },
          }),
        ),
      );

      return true;
    });
  }

  async reorderItems(playlistId: string, playlistItemIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await Promise.all(
        playlistItemIds.map((playlistItemId, index) =>
          tx.playlistTrack.update({
            where: { id: playlistItemId },
            data: { position: index + playlistItemIds.length },
          }),
        ),
      );

      await Promise.all(
        playlistItemIds.map((playlistItemId, index) =>
          tx.playlistTrack.update({
            where: { id: playlistItemId },
            data: { position: index },
          }),
        ),
      );
    });
  }
}
