import { createHash } from "node:crypto";
import type { Context, Next } from "hono";

export type CacheOptions = {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  varyByUser?: boolean;
  skipCache?: boolean;
};

export type CacheHeaders = {
  maxAge?: number;
  etag?: string;
  lastModified?: Date;
  mustRevalidate?: boolean;
};

type CacheConfig = {
  ttl: number;
};

type ServeCacheOptions = {
  c: Context;
  next: Next;
};

/**
 * High-performance caching middleware for customer profile operations
 * Uses Cloudflare KV for distributed caching with intelligent cache invalidation
 */
/**
 * Serve cached response if available and valid
 */
async function serveCachedResponse(
  ctx: ServeCacheOptions,
  cache: KVNamespace,
  cacheKey: string,
  config: CacheConfig
): Promise<Response | undefined> {
  const { c } = ctx;
  const cachedResponse = await getCachedResponse(cache, cacheKey);

  if (!cachedResponse) {
    return; // No cache available
  }

  const { data, timestamp, etag } = cachedResponse;
  const age = Math.floor((Date.now() - timestamp) / 1000);

  // Check if content is fresh
  if (age < config.ttl) {
    // Fresh content - serve from cache
    setResponseHeaders(c, {
      age,
      etag,
      cacheStatus: "HIT",
      maxAge: config.ttl - age,
    });

    return c.json(data);
  }

  return; // Cache expired
}

/**
 * Cache successful response
 */
async function cacheSuccessfulResponse(
  c: Context,
  cache: KVNamespace,
  cacheKey: string,
  config: CacheConfig
) {
  if (c.res.status !== 200) {
    return;
  }

  const responseData = await c.res.clone().json();

  await setCachedResponse(
    cache,
    cacheKey,
    {
      data: responseData,
      timestamp: Date.now(),
      etag: generateETag(responseData),
    },
    config.ttl
  );

  setResponseHeaders(c, {
    age: 0,
    etag: generateETag(responseData),
    cacheStatus: "MISS",
    maxAge: config.ttl,
  });
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = "cache",
    varyByUser = true,
    skipCache = false,
  } = options;

  return async (c: Context, next: Next) => {
    // Skip caching for non-GET requests or when explicitly disabled
    if (c.req.method !== "GET" || skipCache) {
      return next();
    }

    const cache = c.env.CACHE as KVNamespace;

    if (!cache) {
      console.warn("KV cache not available, skipping cache");
      return next();
    }

    try {
      const cacheKey = generateCacheKey(c, keyPrefix, varyByUser);

      const config: CacheConfig = { ttl };

      // Try to serve from cache
      const cachedResponse = await serveCachedResponse(
        { c, next },
        cache,
        cacheKey,
        config
      );

      if (cachedResponse) {
        return cachedResponse;
      }

      // No cache or expired - fetch fresh data
      await next();

      // Cache the response if successful
      await cacheSuccessfulResponse(c, cache, cacheKey, config);
    } catch (error) {
      console.error("Cache middleware error:", error);
      // Continue without caching on error
      return next();
    }
  };
}

/**
 * Generate cache key based on request and user context
 */
function generateCacheKey(
  c: Context,
  prefix: string,
  varyByUser: boolean
): string {
  const url = new URL(c.req.url);
  const pathname = url.pathname;
  const searchParams = url.searchParams.toString();

  const keyParts = [prefix, pathname];

  if (searchParams) {
    keyParts.push(searchParams);
  }

  if (varyByUser) {
    const user = c.get("user");
    if (user?.id) {
      keyParts.push(`user:${user.id}`);
    }
  }

  // Create a hash of the key to ensure consistent length and valid characters
  const keyString = keyParts.join(":");
  return createHash("md5").update(keyString).digest("hex");
}

/**
 * Get cached response from KV store
 */
async function getCachedResponse(cache: KVNamespace, key: string) {
  try {
    const cached = await cache.get(key, "json");
    return cached as CachedResponse | null;
  } catch (error) {
    console.error("Error getting cached response:", error);
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
    console.error("Error setting cached response:", error);
  }
}

/**
 * Generate ETag for response data
 */
function generateETag(data: unknown): string {
  const content = JSON.stringify(data);
  return `"${createHash("md5").update(content).digest("hex")}"`;
}

/**
 * Set cache-related response headers
 */
function setResponseHeaders(
  c: Context,
  options: {
    age?: number;
    etag?: string;
    cacheStatus?: string;
    maxAge?: number;
  }
) {
  const { age, etag, cacheStatus, maxAge } = options;

  if (age !== undefined) {
    c.res.headers.set("Age", age.toString());
  }

  if (etag) {
    c.res.headers.set("ETag", etag);
  }

  if (cacheStatus) {
    c.res.headers.set("X-Cache-Status", cacheStatus);
  }

  if (maxAge !== undefined) {
    c.res.headers.set("Cache-Control", `public, max-age=${maxAge}`);
  }
}

/**
 * Set client-side cache headers
 */
export function setCacheHeaders(c: Context, headers: CacheHeaders) {
  const { maxAge, etag, lastModified, mustRevalidate } = headers;

  let cacheControl = "public";

  if (maxAge !== undefined) {
    cacheControl += `, max-age=${maxAge}`;
  }

  if (mustRevalidate) {
    cacheControl += ", must-revalidate";
  }

  c.res.headers.set("Cache-Control", cacheControl);

  if (etag) {
    c.res.headers.set("ETag", etag);
  }

  if (lastModified) {
    c.res.headers.set("Last-Modified", lastModified.toUTCString());
  }
}

/**
 * Cache invalidation utilities
 */
export class CacheInvalidator {
  private readonly cache: KVNamespace;

  constructor(cache: KVNamespace) {
    this.cache = cache;
  }

  /**
   * Invalidate user-specific cache entries
   */
  async invalidateUserCache(userId: string, patterns: string[] = []) {
    // Use actual API paths that match cacheMiddleware routes
    const defaultPatterns = [
      "/api/customers/profile",
      "/api/customers/profile/full",
      "/api/customers/profile/analytics",
      "/api/customers/addresses",
      "/api/customers/payment-methods",
      "/api/customers/wishlist",
      "/api/customers/notifications",
    ];

    const allPatterns = [...defaultPatterns, ...patterns];

    console.log("[CacheInvalidator] Invalidating cache for user:", userId);

    const deletePromises = allPatterns.map((pattern) => {
      // Use URL constructor with base parameter - domain is just for parsing, only pathname matters
      const parsedUrl = new URL(pattern, "https://cache-key-base");
      const key = generateCacheKey(
        {
          req: { url: parsedUrl.href },
          get: () => ({ id: userId }),
        } as unknown as Context,
        "cache",
        true
      );
      console.log(`[CacheInvalidator] Deleting key for ${pattern}:`, key);
      return this.cache.delete(key);
    });

    await Promise.all(deletePromises);
    console.log("[CacheInvalidator] Cache invalidation complete");
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
  clearAllCache() {
    // KV doesn't support bulk delete, so this would need to be implemented
    // with a prefix-based approach or keep track of keys separately
    console.warn("clearAllCache not implemented - KV limitation");
  }
}

/**
 * Smart cache warming for critical user data
 */
export class CacheWarmer {
  private readonly cache: KVNamespace;

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
      this.cache.put(
        key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
          etag: generateETag(data),
        }),
        { expirationTtl: ttl }
      )
    );

    await Promise.all(promises);
  }
}

// Types
type CachedResponse = {
  data: unknown;
  timestamp: number;
  etag: string;
};

// Utilities are already exported at their class declarations above
