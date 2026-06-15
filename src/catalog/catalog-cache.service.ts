import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

@Injectable()
export class CatalogCacheService {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly configService: ConfigService) {
    this.ttlMs =
      this.configService.getOrThrow<number>('catalog.cacheTtlSeconds') * 1000;
    this.maxEntries = this.configService.getOrThrow<number>(
      'catalog.cacheMaxEntries',
    );
  }

  async getOrSet<T>(
    method: string,
    params: unknown,
    factory: () => Promise<T>,
  ): Promise<T> {
    if (this.ttlMs <= 0) {
      return factory();
    }

    const now = Date.now();
    this.pruneExpired(now);

    const key = this.createKey(method, params);
    const cached = this.entries.get(key) as CacheEntry<T> | undefined;

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    if (cached) {
      this.entries.delete(key);
    }

    const value = await factory();

    this.entries.set(key, {
      expiresAt: now + this.ttlMs,
      value,
    });
    this.pruneOverflow();

    return value;
  }

  createKey(method: string, params: unknown) {
    return `${method}:${JSON.stringify(this.normalize(params))}`;
  }

  private pruneExpired(now: number) {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  private pruneOverflow() {
    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value as string | undefined;

      if (!oldestKey) {
        return;
      }

      this.entries.delete(oldestKey);
    }
  }

  private normalize(value: unknown): unknown {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.normalize(item))
        .filter((item) => item !== undefined)
        .sort((left, right) =>
          JSON.stringify(left).localeCompare(JSON.stringify(right)),
        );
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([key, item]) => [key, this.normalize(item)] as const)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right)),
    );
  }
}
