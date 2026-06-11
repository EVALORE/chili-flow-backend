import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

interface UploadFileForFilter {
  mimetype: string;
}

type AudioFileFilterCallback = (
  error: Error | null,
  acceptFile: boolean,
) => void;

const allowedMimeTypes = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
]);

export function audioFileFilter(
  _req: unknown,
  file: UploadFileForFilter,
  callback: AudioFileFilterCallback,
) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(new BadRequestException('Only audio files are allowed'), false);

    return;
  }

  callback(null, true);
}

export function createStoredAudioFilename(originalName: string) {
  const extension = extname(originalName).toLowerCase();
  return `${randomUUID()}${extension}`;
}
