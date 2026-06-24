import { BadRequestException } from '@nestjs/common';
import { TrackSource } from '../../prisma/generated/enums';
import { JamendoService } from '../jamendo/jamendo.service';
import { UploadedTracksService } from '../uploaded-tracks/uploaded-tracks.service';
import { RecentlyPlayedRepository } from './recently-played.repository';
import { RecentlyPlayedService } from './recently-played.service';

describe('RecentlyPlayedService', () => {
  const playedAt = new Date('2026-06-10T10:00:00.000Z');

  const createService = () => {
    const recentlyPlayedRepository = {
      create: jest.fn(),
      findManyByOwner: jest.fn(),
    } as unknown as jest.Mocked<RecentlyPlayedRepository>;

    const uploadedTracksService = {
      findOwnedUploadedTrack: jest.fn(),
    } as unknown as jest.Mocked<UploadedTracksService>;

    const jamendoService = {
      findTrack: jest.fn(),
    } as unknown as jest.Mocked<JamendoService>;

    return {
      recentlyPlayedRepository,
      service: new RecentlyPlayedService(
        recentlyPlayedRepository,
        uploadedTracksService,
        jamendoService,
      ),
      uploadedTracksService,
    };
  };

  it('delegates date filtering and pagination to the repository', async () => {
    const { recentlyPlayedRepository, service } = createService();

    recentlyPlayedRepository.findManyByOwner.mockResolvedValue([
      {
        id: 'history-1',
        ownerId: 'user-1',
        source: TrackSource.JAMENDO,
        sourceId: 'jam-1',
        title: 'Track',
        artist: 'Artist',
        coverUrl: null,
        audioUrl: 'https://audio.test/track.mp3',
        duration: 120,
        playedAt,
      },
    ]);

    await expect(
      service.list('user-1', {
        limit: 10,
        offset: 5,
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-30T23:59:59.999Z',
      }),
    ).resolves.toEqual([
      {
        id: 'history-1',
        source: 'jamendo',
        sourceId: 'jam-1',
        title: 'Track',
        artist: 'Artist',
        coverUrl: null,
        audioUrl: 'https://audio.test/track.mp3',
        duration: 120,
        playedAt,
      },
    ]);

    expect(recentlyPlayedRepository.findManyByOwner).toHaveBeenCalledWith(
      'user-1',
      {
        limit: 10,
        offset: 5,
        from: new Date('2026-06-01T00:00:00.000Z'),
        to: new Date('2026-06-30T23:59:59.999Z'),
      },
    );
  });

  it('rejects inverted date ranges', async () => {
    const { recentlyPlayedRepository, service } = createService();

    await expect(
      service.list('user-1', {
        limit: 20,
        offset: 0,
        from: '2026-06-30T00:00:00.000Z',
        to: '2026-06-01T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(recentlyPlayedRepository.findManyByOwner).not.toHaveBeenCalled();
  });

  it('uses the uploaded track ownership check when saving uploaded history', async () => {
    const { recentlyPlayedRepository, service, uploadedTracksService } =
      createService();

    uploadedTracksService.findOwnedUploadedTrack.mockResolvedValue({
      id: 'uploaded-1',
      ownerId: 'user-1',
      title: 'Upload',
      artist: 'Uploader',
      genre: null,
      filePath: '/tmp/upload.mp3',
      publicUrl: 'http://localhost:3000/uploads/upload.mp3',
      duration: 90,
      createdAt: playedAt,
      updatedAt: playedAt,
    });
    recentlyPlayedRepository.create.mockImplementation(async (data) => ({
      id: 'history-1',
      playedAt,
      ...data,
    }));

    await service.create('user-1', {
      source: 'uploaded',
      sourceId: 'uploaded-1',
    });

    expect(uploadedTracksService.findOwnedUploadedTrack).toHaveBeenCalledWith(
      'user-1',
      'uploaded-1',
    );
    expect(recentlyPlayedRepository.create).toHaveBeenCalledWith({
      ownerId: 'user-1',
      source: TrackSource.UPLOADED,
      sourceId: 'uploaded-1',
      title: 'Upload',
      artist: 'Uploader',
      coverUrl: null,
      audioUrl: 'http://localhost:3000/uploads/upload.mp3',
      duration: 90,
    });
  });
});
