import { ConfigService } from '@nestjs/config';
import { CatalogCacheService } from './catalog-cache.service';

describe('CatalogCacheService', () => {
  let now = 1_000;

  const createService = (ttlSeconds = 60, maxEntries = 500) => {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, number> = {
          'catalog.cacheTtlSeconds': ttlSeconds,
          'catalog.cacheMaxEntries': maxEntries,
        };

        return values[key];
      }),
    } as unknown as ConfigService;

    return new CatalogCacheService(configService);
  };

  beforeEach(() => {
    now = 1_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns cached values before TTL expiry', async () => {
    const service = createService();
    const factory = jest.fn().mockResolvedValue({ count: 1 });

    const first = await service.getOrSet(
      'searchTracks',
      { search: 'chill' },
      factory,
    );
    const second = await service.getOrSet(
      'searchTracks',
      { search: 'chill' },
      factory,
    );

    expect(first).toEqual({ count: 1 });
    expect(second).toEqual({ count: 1 });
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('refreshes values after TTL expiry', async () => {
    const service = createService(60);
    const factory = jest
      .fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 2 });

    await service.getOrSet('searchTracks', { search: 'chill' }, factory);
    now = 61_001;
    const result = await service.getOrSet(
      'searchTracks',
      { search: 'chill' },
      factory,
    );

    expect(result).toEqual({ count: 2 });
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('uses stable keys for reordered object keys and array values', async () => {
    const service = createService();
    const firstFactory = jest.fn().mockResolvedValue({ count: 1 });
    const secondFactory = jest.fn().mockResolvedValue({ count: 2 });

    await service.getOrSet(
      'searchTracks',
      { tags: ['electronic', 'ambient'], limit: 20, offset: undefined },
      firstFactory,
    );
    const result = await service.getOrSet(
      'searchTracks',
      { limit: 20, tags: ['ambient', 'electronic'] },
      secondFactory,
    );

    expect(result).toEqual({ count: 1 });
    expect(firstFactory).toHaveBeenCalledTimes(1);
    expect(secondFactory).not.toHaveBeenCalled();
  });

  it('evicts the oldest entry when the cache exceeds max size', async () => {
    const service = createService(60, 2);
    const factory = jest.fn((value: number) => Promise.resolve(value));

    await service.getOrSet('findTrack', { id: '1' }, () => factory(1));
    await service.getOrSet('findTrack', { id: '2' }, () => factory(2));
    await service.getOrSet('findTrack', { id: '3' }, () => factory(3));

    const result = await service.getOrSet('findTrack', { id: '1' }, () =>
      factory(4),
    );

    expect(result).toBe(4);
    expect(factory).toHaveBeenCalledTimes(4);
  });

  it('bypasses the cache when TTL is zero', async () => {
    const service = createService(0);
    const factory = jest
      .fn()
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 2 });

    await service.getOrSet('searchTracks', { search: 'chill' }, factory);
    const result = await service.getOrSet(
      'searchTracks',
      { search: 'chill' },
      factory,
    );

    expect(result).toEqual({ count: 2 });
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
