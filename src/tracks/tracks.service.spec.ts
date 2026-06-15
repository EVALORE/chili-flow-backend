import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TracksRepository } from './tracks.repository';
import { TracksService } from './tracks.service';

describe('TracksService', () => {
  const createService = () => {
    const tracksRepository = {
      create: jest.fn(),
      findManyByOwner: jest.fn(),
      findOwnedById: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<TracksRepository>;

    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'uploads.dir': '/tmp/chili-flow-test-uploads',
          'uploads.publicBackendUrl': 'http://localhost:3000',
        };

        return values[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;

    return {
      service: new TracksService(tracksRepository, configService),
      tracksRepository,
    };
  };

  it('rejects uploads without a file', async () => {
    const { service, tracksRepository } = createService();

    await expect(
      service.upload('user-1', { title: 'Track', artist: 'Artist' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(tracksRepository.create).not.toHaveBeenCalled();
  });

  it('rejects uploads whose content is not valid audio', async () => {
    const { service, tracksRepository } = createService();

    await expect(
      service.upload('user-1', { title: 'Track', artist: 'Artist' }, {
        mimetype: 'audio/mpeg',
        originalname: 'track.mp3',
        buffer: Buffer.from('not audio'),
      } as Express.Multer.File),
    ).rejects.toThrow('Only valid audio files are allowed');

    expect(tracksRepository.create).not.toHaveBeenCalled();
  });
});
