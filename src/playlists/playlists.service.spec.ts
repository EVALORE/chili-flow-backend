import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TrackSource } from '../../prisma/generated/enums';
import { JamendoService } from '../jamendo/jamendo.service';
import { TracksService } from '../tracks/tracks.service';
import { PlaylistsRepository } from './playlists.repository';
import { PlaylistsService } from './playlists.service';

describe('PlaylistsService', () => {
  const createdAt = new Date('2026-06-01T00:00:00.000Z');
  const updatedAt = new Date('2026-06-02T00:00:00.000Z');

  const playlist = {
    id: 'playlist-1',
    ownerId: 'user-1',
    name: 'Favorites',
    description: null,
    createdAt,
    updatedAt,
    tracks: [
      {
        id: 'track-1',
        playlistId: 'playlist-1',
        source: TrackSource.JAMENDO,
        sourceId: 'jam-1',
        title: 'One',
        artist: 'Artist',
        coverUrl: null,
        audioUrl: 'https://audio.test/1.mp3',
        duration: 120,
        position: 0,
        addedAt: createdAt,
      },
      {
        id: 'track-2',
        playlistId: 'playlist-1',
        source: TrackSource.JAMENDO,
        sourceId: 'jam-2',
        title: 'Two',
        artist: 'Artist',
        coverUrl: null,
        audioUrl: 'https://audio.test/2.mp3',
        duration: 180,
        position: 1,
        addedAt: createdAt,
      },
    ],
  };

  const createService = () => {
    const playlistsRepository = {
      findManyByOwner: jest.fn(),
      create: jest.fn(),
      findOwnedById: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      addTrack: jest.fn(),
      removeTrack: jest.fn(),
      reorderTracks: jest.fn(),
    } as unknown as jest.Mocked<PlaylistsRepository>;

    const tracksService = {
      findOwnedTrack: jest.fn(),
    } as unknown as jest.Mocked<TracksService>;

    const jamendoService = {
      findTrack: jest.fn(),
    } as unknown as jest.Mocked<JamendoService>;

    return {
      jamendoService,
      playlistsRepository,
      service: new PlaylistsService(
        playlistsRepository,
        tracksService,
        jamendoService,
      ),
      tracksService,
    };
  };

  it('throws not found when a playlist is not owned by the user', async () => {
    const { playlistsRepository, service } = createService();

    playlistsRepository.findOwnedById.mockResolvedValue(null);

    await expect(
      service.findOne('user-1', 'playlist-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delegates uploaded track ownership checks before adding a track', async () => {
    const { playlistsRepository, service, tracksService } = createService();

    playlistsRepository.findOwnedById
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(playlist);
    tracksService.findOwnedTrack.mockResolvedValue({
      id: 'uploaded-1',
      ownerId: 'user-1',
      title: 'Upload',
      artist: 'Uploader',
      genre: null,
      filePath: '/tmp/upload.mp3',
      publicUrl: 'http://localhost:3000/uploads/upload.mp3',
      duration: 90,
      createdAt,
      updatedAt,
    });

    await service.addTrack('user-1', 'playlist-1', {
      source: 'uploaded',
      sourceId: 'uploaded-1',
    });

    expect(tracksService.findOwnedTrack).toHaveBeenCalledWith(
      'user-1',
      'uploaded-1',
    );
    expect(playlistsRepository.addTrack).toHaveBeenCalledWith('playlist-1', {
      source: TrackSource.UPLOADED,
      sourceId: 'uploaded-1',
      title: 'Upload',
      artist: 'Uploader',
      audioUrl: 'http://localhost:3000/uploads/upload.mp3',
      duration: 90,
    });
  });

  it('rejects reorder payloads with duplicate track IDs', async () => {
    const { playlistsRepository, service } = createService();

    playlistsRepository.findOwnedById.mockResolvedValue(playlist);

    await expect(
      service.reorderTracks('user-1', 'playlist-1', {
        trackIds: ['track-1', 'track-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(playlistsRepository.reorderTracks).not.toHaveBeenCalled();
  });

  it('rejects reorder payloads that do not match every playlist track', async () => {
    const { playlistsRepository, service } = createService();

    playlistsRepository.findOwnedById.mockResolvedValue(playlist);

    await expect(
      service.reorderTracks('user-1', 'playlist-1', {
        trackIds: ['track-1', 'missing-track'],
      }),
    ).rejects.toThrow('Track IDs must match the playlist tracks');

    expect(playlistsRepository.reorderTracks).not.toHaveBeenCalled();
  });

  it('reorders tracks and returns the updated playlist detail', async () => {
    const { playlistsRepository, service } = createService();
    const reordered = {
      ...playlist,
      tracks: [playlist.tracks[1], playlist.tracks[0]],
    };

    playlistsRepository.findOwnedById
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(reordered);

    await expect(
      service.reorderTracks('user-1', 'playlist-1', {
        trackIds: ['track-2', 'track-1'],
      }),
    ).resolves.toMatchObject({
      id: 'playlist-1',
      trackCount: 2,
      totalDuration: 300,
      tracks: [{ id: 'track-2' }, { id: 'track-1' }],
    });

    expect(playlistsRepository.reorderTracks).toHaveBeenCalledWith(
      'playlist-1',
      ['track-2', 'track-1'],
    );
  });
});
