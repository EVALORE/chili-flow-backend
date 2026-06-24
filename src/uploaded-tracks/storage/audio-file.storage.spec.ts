import { BadRequestException } from '@nestjs/common';
import {
  audioFileFilter,
  validateAudioFileAndCreateStoredFilename,
} from './audio-file.storage';

describe('audio file storage validation', () => {
  it('accepts compatible audio MIME types and file extensions', () => {
    const callback = jest.fn();

    audioFileFilter(
      {},
      { mimetype: 'audio/mpeg', originalname: 'track.mp3' },
      callback,
    );

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('rejects non-audio MIME types', () => {
    const callback = jest.fn();

    audioFileFilter(
      {},
      { mimetype: 'image/png', originalname: 'cover.png' },
      callback,
    );

    expect(callback).toHaveBeenCalledWith(
      expect.any(BadRequestException),
      false,
    );
  });

  it('rejects mismatched MIME type and extension combinations', () => {
    const callback = jest.fn();

    audioFileFilter(
      {},
      { mimetype: 'audio/mpeg', originalname: 'track.wav' },
      callback,
    );

    expect(callback).toHaveBeenCalledWith(
      expect.any(BadRequestException),
      false,
    );
  });

  it('creates a stored filename from a valid audio signature', () => {
    const filename = validateAudioFileAndCreateStoredFilename({
      mimetype: 'audio/mpeg',
      originalname: 'track.mp3',
      buffer: Buffer.from('ID3 valid mp3 bytes'),
    });

    expect(filename).toMatch(/^[0-9a-f-]+\.mp3$/);
  });

  it('rejects files whose extension and content signature do not match', () => {
    expect(() =>
      validateAudioFileAndCreateStoredFilename({
        mimetype: 'audio/mpeg',
        originalname: 'track.mp3',
        buffer: Buffer.from('not audio'),
      }),
    ).toThrow('Only valid audio files are allowed');
  });
});
