import { ConfigService } from '@nestjs/config';
import { JamendoService } from '../jamendo/jamendo.service';
import { CatalogCacheService } from './catalog-cache.service';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  const createService = () => {
    const jamendoService = {
      searchTracks: jest.fn(),
      findAlbums: jest.fn(),
      getTrackFileUrl: jest.fn(),
    };
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, number> = {
          'catalog.cacheTtlSeconds': 60,
          'catalog.cacheMaxEntries': 500,
        };

        return values[key];
      }),
    } as unknown as ConfigService;
    const cacheService = new CatalogCacheService(configService);
    const service = new CatalogService(
      jamendoService as unknown as JamendoService,
      cacheService,
    );

    return { jamendoService, service };
  };

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('caches repeated equivalent public queries', async () => {
    const { jamendoService, service } = createService();

    jamendoService.searchTracks.mockResolvedValue({ count: 1, results: [] });

    const first = await service.searchTracks({
      search: 'chill',
      tags: ['electronic', 'ambient'],
      limit: 20,
      offset: 0,
    });
    const second = await service.searchTracks({
      offset: 0,
      limit: 20,
      tags: ['ambient', 'electronic'],
      search: 'chill',
    });

    expect(first).toEqual({ count: 1, results: [] });
    expect(second).toEqual({ count: 1, results: [] });
    expect(jamendoService.searchTracks).toHaveBeenCalledTimes(1);
  });

  it('does not cache upstream errors', async () => {
    const { jamendoService, service } = createService();

    jamendoService.findAlbums
      .mockRejectedValueOnce(new Error('upstream failed'))
      .mockResolvedValueOnce({ count: 0, results: [] });

    await expect(service.findAlbums({ limit: 20, offset: 0 })).rejects.toThrow(
      'upstream failed',
    );
    await expect(service.findAlbums({ offset: 0, limit: 20 })).resolves.toEqual(
      {
        count: 0,
        results: [],
      },
    );

    expect(jamendoService.findAlbums).toHaveBeenCalledTimes(2);
  });

  it('does not cache track file URL lookups', async () => {
    const { jamendoService, service } = createService();

    jamendoService.getTrackFileUrl.mockResolvedValue(
      'https://files.test/1.mp3',
    );

    await service.getTrackFileUrl('1');
    await service.getTrackFileUrl('1');

    expect(jamendoService.getTrackFileUrl).toHaveBeenCalledTimes(2);
  });
});
