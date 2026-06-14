import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TracksRepository } from './tracks.repository';
import { UploadTrackDto } from './dto/upload-track.dto';
import { join, resolve } from 'node:path';
import { unlink, mkdir, writeFile } from 'node:fs/promises';
import { validateAudioFileAndCreateStoredFilename } from './storage/audio-file.storage';
import { UploadedTrackResponseDto } from './dto/uploaded-track-response.dto';
import { UploadedTrackModel } from '../../prisma/generated/models';

@Injectable()
export class TracksService {
  constructor(
    private readonly tracksRepository: TracksRepository,
    private readonly configService: ConfigService,
  ) {}

  async upload(
    ownerId: string,
    dto: UploadTrackDto,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Audio File is required');
    }

    const uploadsDir = resolve(
      this.configService.getOrThrow<string>('uploads.dir'),
    );
    await mkdir(uploadsDir, { recursive: true });

    const filename = validateAudioFileAndCreateStoredFilename(file);
    const filePath = join(uploadsDir, filename);
    const publicUrl = new URL(
      `/uploads/${filename}`,
      this.configService.getOrThrow<string>('uploads.publicBackendUrl'),
    ).toString();

    await writeFile(filePath, file.buffer);

    try {
      const track = await this.tracksRepository.create({
        ownerId,
        title: dto.title.trim(),
        artist: dto.artist.trim(),
        genre: dto.genre?.trim() || undefined,
        filePath,
        publicUrl,
      });

      return this._toResponse(track);
    } catch (error) {
      await this._deleteStoredFile(filePath);
      throw error;
    }
  }

  async list(ownerId: string) {
    const tracks = await this.tracksRepository.findManyByOwner(ownerId);
    return tracks.map((track) => this._toResponse(track));
  }

  async delete(ownerId: string, id: string) {
    const track = await this.tracksRepository.findOwnedById(ownerId, id);

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    await this._deleteStoredFile(track.filePath);
    await this.tracksRepository.deleteById(track.id);

    return { deleted: true };
  }

  async findOwnedTrack(ownerId: string, id: string) {
    const track = await this.tracksRepository.findOwnedById(ownerId, id);

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    return track;
  }

  private async _deleteStoredFile(filePath: string) {
    try {
      await unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private _toResponse(track: UploadedTrackModel): UploadedTrackResponseDto {
    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      genre: track.genre,
      publicUrl: track.publicUrl,
      duration: track.duration,
      createdAt: track.createdAt,
      updatedAt: track.updatedAt,
    };
  }
}
