import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TracksRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    ownerId: string;
    title: string;
    artist: string;
    genre?: string;
    filePath: string;
    publicUrl: string;
  }) {
    return this.prisma.uploadedTrack.create({ data });
  }

  findManyByOwner(ownerId: string) {
    return this.prisma.uploadedTrack.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOwnedById(ownerId: string, id: string) {
    return this.prisma.uploadedTrack.findFirst({
      where: { id, ownerId },
    });
  }

  deleteById(id: string) {
    return this.prisma.uploadedTrack.delete({
      where: { id },
    });
  }
}
