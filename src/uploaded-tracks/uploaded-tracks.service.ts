import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadedTracksRepository } from './uploaded-tracks.repository';
import { CreateUploadedTrackDto } from './dto/create-uploaded-track.dto';
import { join, resolve } from 'node:path';
import { unlink, mkdir, writeFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { validateAudioFileAndCreateStoredFilename } from './storage/audio-file.storage';
import { UploadedTrackResponseDto } from './dto/uploaded-track-response.dto';
import type { UploadedTrackModel } from '../../prisma/generated/models';

@Injectable()
export class UploadedTracksService {
  private readonly logger = new Logger(UploadedTracksService.name);

  constructor(
    private readonly uploadedTracksRepository: UploadedTracksRepository,
    private readonly configService: ConfigService,
  ) {}

  async create(
    ownerId: string,
    dto: CreateUploadedTrackDto,
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
      const track = await this.uploadedTracksRepository.create({
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
    const tracks = await this.uploadedTracksRepository.findManyByOwner(ownerId);
    return tracks.map((track) => this._toResponse(track));
  }

  async delete(ownerId: string, id: string) {
    const track = await this.uploadedTracksRepository.findOwnedById(
      ownerId,
      id,
    );

    if (!track) {
      throw new NotFoundException('Uploaded track not found');
    }

    await this.uploadedTracksRepository.deleteById(track.id);
    await this._deleteStoredFileBestEffort(track.filePath);

    return { deleted: true };
  }

  async findOwnedUploadedTrack(ownerId: string, id: string) {
    const track = await this.uploadedTracksRepository.findOwnedById(
      ownerId,
      id,
    );

    if (!track) {
      throw new NotFoundException('Uploaded track not found');
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

  private async _deleteStoredFileBestEffort(filePath: string) {
    try {
      await unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete uploaded audio file: ${message}`);
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
