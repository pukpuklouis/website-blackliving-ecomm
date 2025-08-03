import { Context, Next } from 'hono';
import { createHash } from 'crypto';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  varyByUser?: boolean;
  skipCache?: boolean;
  staleWhileRevalidate?: number; // Additional time to serve stale content
}

export interface CacheHeaders {
  maxAge?: number;
  etag?: string;
  lastModified?: Date;
  mustRevalidate?: boolean;
}

/**
 * High-performance caching middleware for customer profile operations
 * Uses Cloudflare KV for distributed caching with intelligent cache invalidation
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'cache',
    varyByUser = true,
    skipCache = false,
    staleWhileRevalidate = 60, // 1 minute stale serving
  } = options;

  return async (c: Context, next: Next) => {
    // Skip caching for non-GET requests or when explicitly disabled
    if (c.req.method !== 'GET' || skipCache) {
      return next();
    }

    try {
      const cacheKey = generateCacheKey(c, keyPrefix, varyByUser);
      const cache = c.env.CACHE as KVNamespace;

      if (!cache) {
        console.warn('KV cache not available, skipping cache');
        return next();
      }

      // Try to get cached response
      const cachedResponse = await getCachedResponse(cache, cacheKey);
      
      if (cachedResponse) {
        const { data, timestamp, etag } = cachedResponse;
        const age = Math.floor((Date.now() - timestamp) / 1000);
        
        // Check if content is fresh
        if (age < ttl) {
          // Fresh content - serve from cache
          setResponseHeaders(c, {
            age,
            etag,
            cacheStatus: 'HIT',
            maxAge: ttl - age,
          });
          
          return c.json(data);
        }
        
        // Check if we can serve stale content while revalidating
        if (age < ttl + staleWhileRevalidate) {
          // Serve stale content immediately
          setResponseHeaders(c, {
            age,
            etag,
            cacheStatus: 'STALE',
            maxAge: 0, // Force revalidation on next request
          });
          
          // Trigger background revalidation (fire and forget)
          c.executionCtx?.waitUntil(
            revalidateCache(c, next, cache, cacheKey, ttl)
          );
          
          return c.json(data);
        }
      }

      // No cache or expired - fetch fresh data
      await next();
      
      // Cache the response if it's successful
      if (c.res.status === 200) {
        const responseData = await c.res.clone().json();
        
        await setCachedResponse(cache, cacheKey, {
          data: responseData,
          timestamp: Date.now(),
          etag: generateETag(responseData),
        }, ttl + staleWhileRevalidate);
        
        setResponseHeaders(c, {
          age: 0,
          etag: generateETag(responseData),
          cacheStatus: 'MISS',
          maxAge: ttl,
        });
      }
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without caching on error
      return next();
    }
  };
}

/**
 * Generate cache key based on request and user context
 */
function generateCacheKey(c: Context, prefix: string, varyByUser: boolean): string {
  const url = new URL(c.req.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams.toString();
  
  let keyParts = [prefix, pathname];
  
  if (searchParams) {
    keyParts.push(searchParams);
  }
  
  if (varyByUser) {
    const user = c.get('user');
    if (user?.id) {
      keyParts.push(`user:${user.id}`);
    }
  }
  
  // Create a hash of the key to ensure consistent length and valid characters
  const keyString = keyParts.join(':');
  return createHash('md5').update(keyString).digest('hex');
}

/**
 * Get cached response from KV store
 */
async function getCachedResponse(cache: KVNamespace, key: string) {
  try {
    const cached = await cache.get(key, 'json');
    return cached as CachedResponse | null;
  } catch (error) {
    console.error('Error getting cached response:', error);
    return null;
  }
}

/**
 * Store response in KV cache
 */
async function setCachedResponse(
  cache: KVNamespace, 
  key: string, 
  data: CachedResponse, 
  ttl: number
) {
  try {
    await cache.put(key, JSON.stringify(data), {
      expirationTtl: ttl,
    });
  } catch (error) {
    console.error('Error setting cached response:', error);
  }
}

/**
 * Background revalidation for stale-while-revalidate
 */
async function revalidateCache(
  c: Context,
  next: Next,
  cache: KVNamespace,
  cacheKey: string,
  ttl: number
) {
  try {
    // Create a new context for background execution
    const newContext = c.clone();
    
    await next();
    
    if (newContext.res.status === 200) {
      const responseData = await newContext.res.clone().json();
      
      await setCachedResponse(cache, cacheKey, {
        data: responseData,
        timestamp: Date.now(),
        etag: generateETag(responseData),
      }, ttl);
    }
  } catch (error) {
    console.error('Background revalidation error:', error);
  }
}

/**
 * Generate ETag for response data
 */
function generateETag(data: any): string {
  const content = JSON.stringify(data);
  return `"${createHash('md5').update(content).digest('hex')}"`;
}

/**
 * Set cache-related response headers
 */
function setResponseHeaders(c: Context, options: {
  age?: number;
  etag?: string;
  cacheStatus?: string;
  maxAge?: number;
}) {
  const { age, etag, cacheStatus, maxAge } = options;
  
  if (age !== undefined) {
    c.res.headers.set('Age', age.toString());
  }
  
  if (etag) {
    c.res.headers.set('ETag', etag);
  }
  
  if (cacheStatus) {
    c.res.headers.set('X-Cache-Status', cacheStatus);
  }
  
  if (maxAge !== undefined) {
    c.res.headers.set('Cache-Control', `public, max-age=${maxAge}`);
  }
}

/**
 * Set client-side cache headers
 */
export function setCacheHeaders(c: Context, headers: CacheHeaders) {
  const { maxAge, etag, lastModified, mustRevalidate } = headers;
  
  let cacheControl = 'public';
  
  if (maxAge !== undefined) {
    cacheControl += `, max-age=${maxAge}`;
  }
  
  if (mustRevalidate) {
    cacheControl += ', must-revalidate';
  }
  
  c.res.headers.set('Cache-Control', cacheControl);
  
  if (etag) {
    c.res.headers.set('ETag', etag);
  }
  
  if (lastModified) {
    c.res.headers.set('Last-Modified', lastModified.toUTCString());
  }
}

/**
 * Cache invalidation utilities
 */
export class CacheInvalidator {
  private cache: KVNamespace;
  
  constructor(cache: KVNamespace) {
    this.cache = cache;
  }
  
  /**
   * Invalidate user-specific cache entries
   */
  async invalidateUserCache(userId: string, patterns: string[] = []) {
    const defaultPatterns = [
      'profile',
      'full-profile', 
      'analytics',
      'addresses',
      'payment-methods',
      'wishlist',
      'notifications',
    ];
    
    const allPatterns = [...defaultPatterns, ...patterns];
    
    const deletePromises = allPatterns.map(pattern => {
      const key = generateCacheKey(
        { req: { url: `/${pattern}` }, get: () => ({ id: userId }) } as any,
        'cache',
        true
      );
      return this.cache.delete(key);
    });
    
    await Promise.all(deletePromises);
  }
  
  /**
   * Invalidate specific cache entry
   */
  async invalidateCache(key: string) {
    await this.cache.delete(key);
  }
  
  /**
   * Clear all cache (use with caution)
   */
  async clearAllCache() {
    // KV doesn't support bulk delete, so this would need to be implemented
    // with a prefix-based approach or keep track of keys separately
    console.warn('clearAllCache not implemented - KV limitation');
  }
}

/**
 * Smart cache warming for critical user data
 */
export class CacheWarmer {
  private cache: KVNamespace;
  
  constructor(cache: KVNamespace) {
    this.cache = cache;
  }
  
  /**
   * Warm cache for new user registration
   */
  async warmUserCache(userId: string) {
    // This would be called after user registration to pre-populate cache
    // with empty/default responses to improve first-time user experience
    
    const defaultResponses = [
      {
        key: `profile:${userId}`,
        data: { addresses: [], paymentMethods: [], wishlist: [] },
        ttl: 300,
      },
    ];
    
    const promises = defaultResponses.map(({ key, data, ttl }) =>
      this.cache.put(key, JSON.stringify({
        data,
        timestamp: Date.now(),
        etag: generateETag(data),
      }), { expirationTtl: ttl })
    );
    
    await Promise.all(promises);
  }
}

// Types
interface CachedResponse {
  data: any;
  timestamp: number;
  etag: string;
}

// Utilities are already exported at their class declarations above