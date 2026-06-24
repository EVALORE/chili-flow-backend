import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadedTracksRepository } from './uploaded-tracks.repository';
import { UploadedTracksService } from './uploaded-tracks.service';

describe('UploadedTracksService', () => {
  const createService = () => {
    const uploadedTracksRepository = {
      create: jest.fn(),
      findManyByOwner: jest.fn(),
      findOwnedById: jest.fn(),
      deleteById: jest.fn(),
    } as unknown as jest.Mocked<UploadedTracksRepository>;

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
      service: new UploadedTracksService(
        uploadedTracksRepository,
        configService,
      ),
      uploadedTracksRepository,
    };
  };

  it('rejects uploads without a file', async () => {
    const { service, uploadedTracksRepository } = createService();

    await expect(
      service.create('user-1', { title: 'Track', artist: 'Artist' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(uploadedTracksRepository.create).not.toHaveBeenCalled();
  });

  it('rejects uploads whose content is not valid audio', async () => {
    const { service, uploadedTracksRepository } = createService();

    await expect(
      service.create('user-1', { title: 'Track', artist: 'Artist' }, {
        mimetype: 'audio/mpeg',
        originalname: 'track.mp3',
        buffer: Buffer.from('not audio'),
      } as Express.Multer.File),
    ).rejects.toThrow('Only valid audio files are allowed');

    expect(uploadedTracksRepository.create).not.toHaveBeenCalled();
  });
});
