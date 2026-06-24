import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TrackSource } from '../../prisma/generated/enums';
import { JamendoService } from '../jamendo/jamendo.service';
import { UploadedTracksService } from '../uploaded-tracks/uploaded-tracks.service';
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
      addItem: jest.fn(),
      removeItem: jest.fn(),
      reorderItems: jest.fn(),
    } as unknown as jest.Mocked<PlaylistsRepository>;

    const uploadedTracksService = {
      findOwnedUploadedTrack: jest.fn(),
    } as unknown as jest.Mocked<UploadedTracksService>;

    const jamendoService = {
      findTrack: jest.fn(),
    } as unknown as jest.Mocked<JamendoService>;

    return {
      jamendoService,
      playlistsRepository,
      service: new PlaylistsService(
        playlistsRepository,
        uploadedTracksService,
        jamendoService,
      ),
      uploadedTracksService,
    };
  };

  it('throws not found when a playlist is not owned by the user', async () => {
    const { playlistsRepository, service } = createService();

    playlistsRepository.findOwnedById.mockResolvedValue(null);

    await expect(
      service.findOne('user-1', 'playlist-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delegates uploaded track ownership checks before creating an item', async () => {
    const { playlistsRepository, service, uploadedTracksService } =
      createService();

    playlistsRepository.findOwnedById
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(playlist);
    uploadedTracksService.findOwnedUploadedTrack.mockResolvedValue({
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

    await service.createItem('user-1', 'playlist-1', {
      source: 'uploaded',
      sourceId: 'uploaded-1',
    });

    expect(uploadedTracksService.findOwnedUploadedTrack).toHaveBeenCalledWith(
      'user-1',
      'uploaded-1',
    );
    expect(playlistsRepository.addItem).toHaveBeenCalledWith('playlist-1', {
      source: TrackSource.UPLOADED,
      sourceId: 'uploaded-1',
      title: 'Upload',
      artist: 'Uploader',
      audioUrl: 'http://localhost:3000/uploads/upload.mp3',
      duration: 90,
    });
  });

  it('rejects reorder payloads with duplicate playlist item IDs', async () => {
    const { playlistsRepository, service } = createService();

    playlistsRepository.findOwnedById.mockResolvedValue(playlist);

    await expect(
      service.reorderItems('user-1', 'playlist-1', {
        playlistItemIds: ['track-1', 'track-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(playlistsRepository.reorderItems).not.toHaveBeenCalled();
  });

  it('rejects reorder payloads that do not match every playlist item', async () => {
    const { playlistsRepository, service } = createService();

    playlistsRepository.findOwnedById.mockResolvedValue(playlist);

    await expect(
      service.reorderItems('user-1', 'playlist-1', {
        playlistItemIds: ['track-1', 'missing-track'],
      }),
    ).rejects.toThrow('Playlist item IDs must match the playlist items');

    expect(playlistsRepository.reorderItems).not.toHaveBeenCalled();
  });

  it('reorders items and returns the updated playlist detail', async () => {
    const { playlistsRepository, service } = createService();
    const reordered = {
      ...playlist,
      tracks: [playlist.tracks[1], playlist.tracks[0]],
    };

    playlistsRepository.findOwnedById
      .mockResolvedValueOnce(playlist)
      .mockResolvedValueOnce(reordered);

    await expect(
      service.reorderItems('user-1', 'playlist-1', {
        playlistItemIds: ['track-2', 'track-1'],
      }),
    ).resolves.toMatchObject({
      id: 'playlist-1',
      itemCount: 2,
      totalDuration: 300,
      items: [{ id: 'track-2' }, { id: 'track-1' }],
    });

    expect(playlistsRepository.reorderItems).toHaveBeenCalledWith(
      'playlist-1',
      ['track-2', 'track-1'],
    );
  });
});
