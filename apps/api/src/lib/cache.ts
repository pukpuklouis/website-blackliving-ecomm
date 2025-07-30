import type { KVNamespace } from '@cloudflare/workers-types';

export class CacheManager {
  constructor(private kv: KVNamespace) {}

  /**
   * Get cached data with optional JSON parsing
   */
  async get<T = any>(key: string, parseJson = true): Promise<T | null> {
    try {
      const value = await this.kv.get(key);
      if (!value) return null;
      
      return parseJson ? JSON.parse(value) : value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cache data with TTL
   */
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await this.kv.put(key, serialized, {
        expirationTtl: ttl,
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear cache by prefix pattern
   */
  async deleteByPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.kv.list({ prefix });
      const deletePromises = keys.keys.map(key => this.kv.delete(key.name));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Cache clear by prefix error:', error);
    }
  }

  /**
   * Get or set cache data with a fallback function
   */
  async getOrSet<T = any>(
    key: string, 
    fallback: () => Promise<T>, 
    ttl = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fallback();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Generate cache keys for different data types
   */
  static keys = {
    products: {
      list: (category?: string, featured?: boolean) => 
        `products:list:${category || 'all'}:${featured || 'all'}`,
      detail: (id: string) => `products:detail:${id}`,
      search: (query: string) => `products:search:${query}`,
    },
    orders: {
      list: (filters?: string) => `orders:list:${filters || 'all'}`,
      detail: (id: string) => `orders:detail:${id}`,
      stats: () => 'orders:stats',
    },
    posts: {
      list: (status?: string) => `posts:list:${status || 'all'}`,
      detail: (id: string) => `posts:detail:${id}`,
      featured: () => 'posts:featured',
    },
    appointments: {
      list: (filters?: string) => `appointments:list:${filters || 'all'}`,
      detail: (id: string) => `appointments:detail:${id}`,
      pending: () => 'appointments:pending',
    },
    analytics: {
      dashboard: () => 'analytics:dashboard',
      sales: () => 'analytics:sales',
    },
  };

  /**
   * Cache with automatic invalidation tags
   */
  async setWithTags(key: string, value: any, tags: string[], ttl = 3600): Promise<void> {
    await this.set(key, value, ttl);
    
    // Store reverse mapping for tag-based invalidation
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = await this.get<string[]>(tagKey, true) || [];
      if (!taggedKeys.includes(key)) {
        taggedKeys.push(key);
        await this.set(tagKey, taggedKeys, ttl);
      }
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = await this.get<string[]>(tagKey, true) || [];
      
      // Delete all keys associated with this tag
      const deletePromises = taggedKeys.map(key => this.delete(key));
      await Promise.all(deletePromises);
      
      // Delete the tag key itself
      await this.delete(tagKey);
    }
  }
}

// Helper function to create cache manager instance
export function createCacheManager(kv: KVNamespace): CacheManager {
  return new CacheManager(kv);
}

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes  
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;