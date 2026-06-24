import { BadRequestException } from '@nestjs/common';
import type { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

interface UploadFileForFilter {
  mimetype: string;
  originalname: string;
}

interface UploadFileForValidation extends UploadFileForFilter {
  buffer: Buffer;
}

interface AudioType {
  canonicalExtension: string;
  compatibleExtensions: readonly string[];
}

type AudioFileFilterCallback = (
  error: Error | null,
  acceptFile: boolean,
) => void;

const INVALID_AUDIO_FILE_MESSAGE = 'Only valid audio files are allowed';

const audioTypesByMimeType = new Map<string, AudioType>([
  [
    'audio/mpeg',
    { canonicalExtension: '.mp3', compatibleExtensions: ['.mp3'] },
  ],
  ['audio/mp3', { canonicalExtension: '.mp3', compatibleExtensions: ['.mp3'] }],
  ['audio/wav', { canonicalExtension: '.wav', compatibleExtensions: ['.wav'] }],
  [
    'audio/x-wav',
    { canonicalExtension: '.wav', compatibleExtensions: ['.wav'] },
  ],
  ['audio/ogg', { canonicalExtension: '.ogg', compatibleExtensions: ['.ogg'] }],
  [
    'audio/webm',
    { canonicalExtension: '.webm', compatibleExtensions: ['.webm'] },
  ],
  [
    'audio/flac',
    { canonicalExtension: '.flac', compatibleExtensions: ['.flac'] },
  ],
  ['audio/aac', { canonicalExtension: '.aac', compatibleExtensions: ['.aac'] }],
  [
    'audio/mp4',
    { canonicalExtension: '.m4a', compatibleExtensions: ['.m4a', '.mp4'] },
  ],
  [
    'audio/x-m4a',
    { canonicalExtension: '.m4a', compatibleExtensions: ['.m4a', '.mp4'] },
  ],
]);

const audioTypesBySignature: AudioType[] = [
  { canonicalExtension: '.mp3', compatibleExtensions: ['.mp3'] },
  { canonicalExtension: '.wav', compatibleExtensions: ['.wav'] },
  { canonicalExtension: '.ogg', compatibleExtensions: ['.ogg'] },
  { canonicalExtension: '.webm', compatibleExtensions: ['.webm'] },
  { canonicalExtension: '.flac', compatibleExtensions: ['.flac'] },
  { canonicalExtension: '.aac', compatibleExtensions: ['.aac'] },
  { canonicalExtension: '.m4a', compatibleExtensions: ['.m4a', '.mp4'] },
];

export function audioFileFilter(
  _req: unknown,
  file: UploadFileForFilter,
  callback: AudioFileFilterCallback,
) {
  const audioType = audioTypesByMimeType.get(file.mimetype);
  const originalExtension = getOriginalExtension(file.originalname);

  if (
    !audioType ||
    !originalExtension ||
    !audioType.compatibleExtensions.includes(originalExtension)
  ) {
    callback(new BadRequestException('Only audio files are allowed'), false);

    return;
  }

  callback(null, true);
}

export function validateAudioFileAndCreateStoredFilename(
  file: UploadFileForValidation,
): string {
  const mimetypeAudioType = audioTypesByMimeType.get(file.mimetype);
  const signatureAudioType = detectAudioType(file.buffer);
  const originalExtension = getOriginalExtension(file.originalname);

  if (
    !mimetypeAudioType ||
    !signatureAudioType ||
    !originalExtension ||
    !mimetypeAudioType.compatibleExtensions.includes(originalExtension) ||
    !signatureAudioType.compatibleExtensions.includes(originalExtension) ||
    mimetypeAudioType.canonicalExtension !==
      signatureAudioType.canonicalExtension
  ) {
    throw new BadRequestException(INVALID_AUDIO_FILE_MESSAGE);
  }

  return `${randomUUID()}${signatureAudioType.canonicalExtension}`;
}

function getOriginalExtension(originalName: string): string {
  return extname(originalName).toLowerCase();
}

function detectAudioType(buffer: Buffer): AudioType | null {
  if (buffer.length < 4) {
    return null;
  }

  if (startsWithAscii(buffer, 'ID3') || isMp3Frame(buffer)) {
    return audioTypesBySignature[0];
  }

  if (startsWithAscii(buffer, 'RIFF') && readsAsciiAt(buffer, 'WAVE', 8)) {
    return audioTypesBySignature[1];
  }

  if (startsWithAscii(buffer, 'OggS')) {
    return audioTypesBySignature[2];
  }

  if (startsWithBytes(buffer, [0x1a, 0x45, 0xdf, 0xa3])) {
    return audioTypesBySignature[3];
  }

  if (startsWithAscii(buffer, 'fLaC')) {
    return audioTypesBySignature[4];
  }

  if (isAacFrame(buffer)) {
    return audioTypesBySignature[5];
  }

  if (isMp4Container(buffer)) {
    return audioTypesBySignature[6];
  }

  return null;
}

function startsWithAscii(buffer: Buffer, value: string): boolean {
  return readsAsciiAt(buffer, value, 0);
}

function readsAsciiAt(buffer: Buffer, value: string, offset: number): boolean {
  return buffer.length >= offset + value.length
    ? buffer.toString('ascii', offset, offset + value.length) === value
    : false;
}

function startsWithBytes(buffer: Buffer, bytes: readonly number[]): boolean {
  return bytes.every((byte, index) => buffer[index] === byte);
}

function isMp3Frame(buffer: Buffer): boolean {
  return (
    buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0
  );
}

function isAacFrame(buffer: Buffer): boolean {
  return (
    buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xf6) === 0xf0
  );
}

function isMp4Container(buffer: Buffer): boolean {
  if (!readsAsciiAt(buffer, 'ftyp', 4)) {
    return false;
  }

  const brand = buffer.toString('ascii', 8, 12);
  return ['M4A ', 'M4B ', 'isom', 'iso2', 'mp41', 'mp42'].includes(brand);
}
