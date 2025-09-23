import { CacheManager, CacheTTL } from './cache';

export interface SearchCacheFilters {
  query: string;
  types?: string[];
  category?: string;
  limit?: number;
  includeContent?: boolean;
}

export class SearchCache {
  constructor(private readonly cache: CacheManager) {}

  private getCacheKey(filters: SearchCacheFilters): string {
    const json = JSON.stringify(filters);
    const base64 = Buffer.from(json).toString('base64');
    const safe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `search:${safe}`;
  }

  async get<T>(filters: SearchCacheFilters): Promise<T | null> {
    return this.cache.get<T>(this.getCacheKey(filters));
  }

  async set<T>(filters: SearchCacheFilters, data: T, ttl = CacheTTL.SHORT): Promise<void> {
    await this.cache.set(this.getCacheKey(filters), data, ttl);
  }

  async invalidate(filters?: SearchCacheFilters): Promise<void> {
    if (!filters) {
      await this.cache.deleteByPrefix('search:');
      return;
    }

    await this.cache.delete(this.getCacheKey(filters));
  }
}
